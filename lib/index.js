"use strict";

const NOT_FOUND_ERR = new Error("Not found.");
NOT_FOUND_ERR.STATUS_CODE = 404;

module.exports = function (config, bloggify) {
    let router = bloggify.require("router");

    router.on("not_found", lien => {
        bloggify.render(lien, "404", NOT_FOUND_ERR);
    });

    router.on("article", lien => {
        let articleId = lien.params.articleId;
        bloggify.getArticleById(articleId, (err, data) => {
            if (err) { return bloggify.render(lien, "error", err); }
            bloggify.render(lien, data.metadata.pageTemplate || "article", data);
        });
    });

    router.on("blog_page", lien => {
        let pageNumber = lien.params.pageNumber - 1
          , limit = config.blogPage.itemCount
          , skip = pageNumber * config.blogPage.itemCount
          ;

        bloggify.getArticles({
            limit: limit
          , skip: skip + 1
        }, (err, data) => {
            if (err) { return bloggify.render(lien, "error", err); }
            bloggify.render(lien, "blog-page", { articles: data });
        });
    });

    router.on("site_page", lien => {
        bloggify.getPageBySlug(lien.params.sitePage, (err, data) => {
            if (err) { return bloggify.render(lien, "error", err); }
            bloggify.render(lien, data.metadata.pageTemplate || "site-page", data);
        });
    });
};
