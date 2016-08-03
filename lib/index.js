"use strict";

const ul = require("ul");

const NOT_FOUND_ERR = new Error("Not found.");
NOT_FOUND_ERR.STATUS_CODE = 404;

exports.init = function (config, bloggify) {
    let router = bloggify.require("router");

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
            if (err) {
                return render(lien, "error", {
                    error: err
                });
            }

            render(lien, data.metadata.pageTemplate || "article", {
                article: data
            });
        });
    });

    // Blog pages (e.g. /blog/page/2)
    router.on("blog_page", lien => {
        let pageNumber = lien.params.pageNumber - 1
          , limit = config.blogPage.itemCount
          , skip = pageNumber * config.blogPage.itemCount
          ;

        bloggify.getArticles({
            limit: limit
          , skip: skip + 1
        }, (err, data) => {
            if (err) { return render(lien, "error", { error: err }); }
            render(lien, "blog-page", {
                articles: data
              , blogPage: pageNumber + 1
            });
        });
    });

    // Site pages (Home, Contact, etc)
    router.on("site_page", lien => {
        bloggify.getPageBySlug(lien.params.sitePage, (err, data) => {
            if (err) { return render(lien, "error", { error: err }); }
            render(lien, data.metadata.pageTemplate || "site-page", {
                content: data
            });
        });
    });
};
