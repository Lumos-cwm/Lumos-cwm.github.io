'use strict';

const pluginConfig = hexo.config['problem-info'] || {};

// the entry function of plugin
function main() {
    // add the "Problem" menu item
    hexo.extend.filter.register('before_generate', function() {
        const themeConfig = hexo.theme && hexo.theme.config;

        if (!themeConfig) {
            hexo.log.warn('[hexo-problem-info] can\'t find theme config');
            return;
        }

        if (!themeConfig.menu || typeof themeConfig.menu !== 'object') {
            themeConfig.menu = {};
        }

        if (!Object.prototype.hasOwnProperty.call(themeConfig.menu, 'Problem')) {
            themeConfig.menu.Problem = `/${pluginConfig.path}/ || ${pluginConfig.icon}`;
            hexo.log.info('[hexo-problem-info] has loaded the \"Problem\" menu item');
        }
    });

    // insert the problem anchor
    const {anchor} = require('./lib/anchor.js')(hexo);
    hexo.extend.filter.register('before_post_render', 
        anchor,
        0
    );

    // generate the problem page
    const {parse} = require('./lib/parse.js')(hexo);
    const {generate} = require('./lib/generate.js')(hexo);
    hexo.extend.generator.register('problem-page', function(locals) {
        return generate(parse(locals.posts.toArray()), {
            path: pluginConfig.path
        });
    });
}

if (pluginConfig.enable === false) {
    hexo.log.info('[hexo-problem-info] is disable');
} else {
    hexo.log.info('[hexo-problem-info] is enable');
    main();
}