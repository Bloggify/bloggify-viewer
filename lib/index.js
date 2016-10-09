"use strict";

const ul = require("ul")
    , Article = require("bloggify-article")
    , Page = require("bloggify-page")
    , sameTime = require("same-time")
    ;

const NOT_FOUND_ERR = new Error("Not found.");
NOT_FOUND_ERR.STATUS_CODE = 404;

exports.init = function (config, bloggify) {

    bloggify.on("plugin-loaded:bloggify-router", router => {
        let render = bloggify.render.bind(bloggify);

        // Not found
        router.on("not_found", lien => {
            render(lien, "404", {
                error: NOT_FOUND_ERR
            });
        });

        // Blog articles
        router.on("article", lien => {
            let articleId = lien.params.articleId;
            bloggify.getArticleById(articleId, (err, data) => {
                if (err) { return lien.next(null, null, err); }
                render(lien, data.metadata.pageTemplate || "article", {
                    page: new Article(data)
                });
            });
        });

        // Blog pages (e.g. /blog/page/2)
        router.on("blog_page", lien => {
            let pageNumber = lien.params.pageNumber - 1
              , limit = config.blogPage.itemCount
              , skip = pageNumber * config.blogPage.itemCount
              ;

            sameTime([
                cb => bloggify.getPageBySlug("blog", cb)
              , cb => bloggify.getArticles({
                    limit: limit
                  , skip: skip
                }, cb)
            ], (err, res) => {
                if (err) { return lien.next(null, null, err); }

                let blogPage = new Page(res[0]);
                blogPage.articles = res[1].map(c => {
                    c.url = `${router._module.blogPath}/{id}-{slug}`;
                    return new Article(c)
                });


                render(lien, "blog-page", {
                    page: blogPage
                  , blogPage: pageNumber + 1
                });
            });
        });

        // Site pages (Home, Contact, etc)
        router.on("site_page", lien => {
            bloggify.getPageBySlug(lien.params.sitePage, (err, data) => {
                if (err) { return lien.next(null, null, err); }
                render(lien, data.metadata.pageTemplate || "site-page", {
                    page: new Page(data)
                });
            });
        });
        });
};
