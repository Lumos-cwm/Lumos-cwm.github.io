/*
insert the problem anchor
*/

'use strict';

module.exports = function main(hexo) {
    function anchor(data) {
        if (typeof data.content !== 'string') {
            return data;
        }

        const pattern = /^[\t ]*```INFO[\t ]*\r?\n([\s\S]*?)^[\t ]*```[\t ]*$/gm;
        const yaml = require('js-yaml');

        var count = 0;
        const used = new Set();

        data.content = data.content.replace(pattern, function(all, match) {
            try {
                const info = yaml.load(match);

                if (!info || typeof info !== 'object' || Array.isArray(info)) {
                    hexo.log.warn(`[hexo-problem-info] ${data.source}: INFO is not object`);
                    return all;
                }

                if (!info.id) {
                    hexo.log.warn(`[hexo-problem-info] ${data.source}: INFO has not id`);
                    return all;
                }

                const id = String(info.id).trim();

                if (!/^[A-Za-z0-9_-]+$/.test(id)) {
                    hexo.log.warn(`[hexo-problem-info] ${data.source}: INFO id is illegal: ${id}`);
                    return all;
                }

                if (used.has(id)) {
                    hexo.log.warn(`[hexo-problem-info] ${data.source}: INFO id is repetition: ${id}`);
                    return all;
                }

                used.add(id);
                count += 1;

                return `<div id="${id}" class="problem-anchor" aria-hidden="true"></div>\n\n${all}`;
            } catch (error) {
                hexo.log.warn(`[hexo-problem-info] can\'t parse the INFO of ${data.source}: ${error.message}`);
                return all;
            }
        });

        hexo.log.info(`[hexo-problem-info] ${data.source}: has inserted ${count} problem anchors`);

        return data;
    }
    
    return {
        anchor
    };
};