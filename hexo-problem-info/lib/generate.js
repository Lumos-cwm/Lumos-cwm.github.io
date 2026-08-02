/*
generate the problem page
*/

'use strict';

module.exports = function main(hexo) {
    function escapeHtml(str) {
        return str
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function createPostUrl(postPath, id) {
        const root = hexo.config.root || '/';
        const normalizedRoot = root.endsWith('/') ? root : `${root}/`;
        const normalizedPath = String(postPath).replace(/^\/+/, '');
        const postUrl = `${normalizedRoot}${normalizedPath}`;

        return id ? `${postUrl}#${encodeURIComponent(id)}` : postUrl;
    }

    function getTable(problems) {
        if (problems.length === 0) {
            return '<p>The problem has not been collected yet.</p>';
        }

        const rows = problems.map(problem => {
            const name = problem.url
                ? `<a href="${escapeHtml(problem.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(problem.name)}</a>`
                : escapeHtml(problem.name);
            const source = escapeHtml(problem.source);
            const tags = problem.tags.map(escapeHtml).join('、');
            const postUrl = escapeHtml(createPostUrl(problem.postPath, problem.id));
            const difficulty = escapeHtml(problem.difficulty);
            const postTitle = escapeHtml(problem.postTitle);

            return `
                <tr>
                    <td>${name}</td>
                    <td>${source}</td>
                    <td>${difficulty}</td>
                    <td>${tags}</td>
                    <td><a href="${postUrl}">${postTitle}</a></td>
                </tr>
            `;
        }).join('');

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
        `;
    }

    function generate(problems, options) {
        problems.sort((left, right) => left.id.localeCompare(right.id));

        hexo.log.info(`[hexo-problem-info] has collected ${problems.length} problems`);

        return {
            path: `${options.path}/index.html`,
            layout: ['page'],
            data: {
                title: 'Problem',
                type: 'problem',
                content: getTable(problems)
            }
        };
    }

    return {
        generate
    };
};