/*
parse all posts and extract problem information
*/

'use strict';

module.exports = function main(hexo) {
    function parse(posts) {
        const problems = [];
        const pattern = /^[\t ]*```INFO[\t ]*\r?\n([\s\S]*?)^[\t ]*```[\t ]*$/gm;
        const yaml = require('js-yaml');

        for (const post of posts) {
            const content = post.raw;

            if (typeof content !== 'string') {
                hexo.log.warn('[hexo-problem-info]: post.raw is not string');
                continue;
            }

            for (const match of content.matchAll(pattern)) {
                try {
                    const info = yaml.load(match[1]);

                    if (!info || typeof info !== 'object' || Array.isArray(info)) {
                        hexo.log.warn(`[hexo-problem-info] ${post.source}: INFO is not object`);
                        continue;
                    }

                    if (!info.id) {
                        hexo.log.warn(`[hexo-problem-info] ${post.source}: INFO has not id`);
                        continue;
                    }

                    if (!info.name) {
                        hexo.log.warn(`[hexo-problem-info] ${post.source}: INFO has not name`);
                        continue;
                    }

                    const id = String(info.id).trim();

                    if (!/^[A-Za-z0-9_-]+$/.test(id)) {
                        hexo.log.warn(`[hexo-problem-info] ${post.source}: INFO id is illegal: ${id}`);
                        continue;
                    }

                    problems.push({
                        id,
                        name: String(info.name),
                        source: info.source ? String(info.source) : '',
                        difficulty: info.difficulty ? String(info.difficulty) : '',
                        url: info.url ? String(info.url) : '',
                        tags: Array.isArray(info.tags) ? info.tags.map(String) : [],
                        postTitle: String(post.title || ''),
                        postPath: String(post.path || '')
                    });
                } catch (error) {
                    hexo.log.warn(`[hexo-problem-info] can\'t parse the INFO of ${post.source}: ${error.message}`);
                }
            }
        }

        return problems;
    }

    return {
        parse
    };
};