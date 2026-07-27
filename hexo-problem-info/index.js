'use strict'

hexo.log.info('[hexo-problem-info] 插件已加载')

const yaml = require('js-yaml')

/**
 * 从一篇文章的原始 Markdown 中提取所有 INFO 代码块。
 * 每个 INFO 代码块代表一道题目。
 */
function parseInfoBlocks(markdown, post) {
    const problems = []
    const pattern = /^```INFO[\t ]*\r?\n([\s\S]*?)^```[\t ]*$/gim

    for (const match of markdown.matchAll(pattern)) {
        try {
            const info = yaml.load(match[1])

            if (!info || typeof info !== 'object' || Array.isArray(info)) {
                hexo.log.warn(`[hexo-problem-info] ${post.source}: INFO 内容不是对象`)
                continue
            }

            if (!info.id) {
                hexo.log.warn(`[hexo-problem-info] ${post.source}: INFO 缺少 id`)
                continue
            }

            const id = String(info.id).trim()

            if (!/^[A-Za-z0-9_-]+$/.test(id)) {
                hexo.log.warn(
                    `[hexo-problem-info] ${post.source}: INFO id 不合法：${id}`
                )
                continue
            }

            if (!info.name) {
                hexo.log.warn(`[hexo-problem-info] ${post.source}: INFO 缺少 name`)
                continue
            }

            problems.push({
                id,
                name: String(info.name),
                source: info.source ? String(info.source) : '',
                difficulty: info.difficulty ? String(info.difficulty) : '',
                url: info.url ? String(info.url) : '',
                tags: Array.isArray(info.tags) ? info.tags.map(String) : [], 
                    /*
                        可能出现的问题是，如果只有一个 tag 并且不是数组形式，那会被解析成字符串或其他东西
                    */
                postTitle: String(post.title || ''),
                postPath: String(post.path || '')
            })
        } catch (error) {
            hexo.log.warn(
                `[hexo-problem-info] 无法解析 ${post.source} 中的 INFO：${error.message}`
            )
        }
    }

    return problems
}

/**
 * 防止题目名称等内容破坏最终生成的 HTML。
 */
function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')
}

/**
 * 把文章路径转换为包含 Hexo root 配置和题目锚点的站内地址。
 */
function createPostUrl(postPath, id) {
    const root = hexo.config.root || '/'
    const normalizedRoot = root.endsWith('/') ? root : `${root}/`
    const normalizedPath = String(postPath).replace(/^\/+/, '')
    const postUrl = `${normalizedRoot}${normalizedPath}`

    return id
        ? `${postUrl}#${encodeURIComponent(id)}`
        : postUrl
}

/**
 * 把题目数据转换成 Butterfly 页面可以显示的 HTML。
 */
function renderProblemTable(problems) {
    if (problems.length === 0) {
        return '<p>暂时没有收录题目。</p>'
    }

    const rows = problems.map(problem => {
        const name = problem.url
            ? `<a href="${escapeHtml(problem.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(problem.name)}</a>`
            : escapeHtml(problem.name)

        const source = escapeHtml(problem.source)
        const tags = problem.tags.map(escapeHtml).join('、')
        const postUrl = createPostUrl(problem.postPath, problem.id)

        return `
            <tr>
                <td>${name}</td>
                <td>${source}</td>
                <td>${escapeHtml(problem.difficulty)}</td>
                <td>${tags}</td>
                <td><a href="${escapeHtml(postUrl)}">${escapeHtml(problem.postTitle)}</a></td>
            </tr>
        `
    }).join('')

    return `
        <div class="problem-table-wrapper">
            <table class="problem-table">
                <thead>
                    <tr>
                        <th>题目</th>
                        <th>来源</th>
                        <th>难度</th>
                        <th>标签</th>
                        <th>题解</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `
}

// 在 Butterfly 的菜单栏中加入 Problem 按钮。
hexo.extend.filter.register('before_generate', function () {
    const themeConfig = hexo.theme && hexo.theme.config

    if (!themeConfig) {
        hexo.log.warn('[hexo-problem-info] 无法读取主题配置')
        return
    }

    if (!themeConfig.menu || typeof themeConfig.menu !== 'object') {
        themeConfig.menu = {}
    }

    if (!Object.prototype.hasOwnProperty.call(themeConfig.menu, 'Problem')) {
        themeConfig.menu.Problem = '/problem/ || fas fa-list'
        hexo.log.info('[hexo-problem-info] 已添加 Problem 菜单项')
    }
})

// 插入题目锚点
hexo.extend.filter.register('before_post_render', function (data) {
    if (typeof data.content !== 'string') {
        return data
    }

    const infoBlockPattern =
        /^[ ]{0,3}```[\t ]*INFO[\t ]*\r?\n([\s\S]*?)^[ ]{0,3}```[\t ]*$/gim

    const usedIds = new Set()
    let insertedCount = 0

    data.content = data.content.replace(
        infoBlockPattern,
        function (fullBlock, yamlContent) {
            try {
                const info = yaml.load(yamlContent)

                if (!info || typeof info !== 'object' || Array.isArray(info)) {
                    return fullBlock
                }

                if (info.id === undefined || info.id === null) {
                    hexo.log.warn(
                        `[hexo-problem-info] ${data.source}: INFO 缺少 id`
                    )
                    return fullBlock
                }

                const id = String(info.id).trim()

                // 限制可用字符，避免生成无效 HTML 或注入属性。
                if (!/^[A-Za-z0-9_-]+$/.test(id)) {
                    hexo.log.warn(
                        `[hexo-problem-info] ${data.source}: INFO id 不合法：${id}`
                    )
                    return fullBlock
                }

                if (usedIds.has(id)) {
                    hexo.log.warn(
                        `[hexo-problem-info] ${data.source}: INFO id 重复：${id}`
                    )
                    return fullBlock
                }

                usedIds.add(id)
                insertedCount += 1

                return (
                    `<div id="${id}" class="problem-anchor" ` +
                    `aria-hidden="true"></div>\n\n${fullBlock}`
                )
            } catch (error) {
                hexo.log.warn(
                    `[hexo-problem-info] 无法解析 ${data.source} 中的 INFO：` +
                    error.message
                )
                return fullBlock
            }
        }
    )

    if (insertedCount > 0) {
        hexo.log.info(
            `[hexo-problem-info] ${data.source}: 插入 ${insertedCount} 个题目锚点`
        )
    }

    return data
}, -1000)

/**
 * 注册 /problem/ 页面生成器。
 */
hexo.extend.generator.register('problem-page', function (locals) {
    const problems = []

    for (const post of locals.posts.toArray()) {
        const markdown = post.raw || post._content || ''

        if (!markdown) {
            hexo.log.warn(`[hexo-problem-info] 无法读取文章源码：${post.source}`)
            continue
        }

        problems.push(...parseInfoBlocks(markdown, post))
    }

    problems.sort((left, right) => left.id.localeCompare(right.id))

    hexo.log.info(`[hexo-problem-info] 共收集到 ${problems.length} 道题目`)

    return {
        path: 'problem/index.html',
        layout: ['page'],
        data: {
            title: 'Problem',
            type: 'problem',
            content: renderProblemTable(problems)
        }
    }
})