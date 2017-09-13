"use strict";

const ul = require("ul")
    , Article = require("bloggify-article")
    , Page = require("bloggify-page")
    , sameTime = require("same-time")
    , Events = require("events")
    ;

const NOT_FOUND_ERR = new Error("Not found.");
NOT_FOUND_ERR.STATUS_CODE = 404;

const Viewer = module.exports = Bloggify.viewer = new Events()
Viewer.on("article", ctx => {
    const articleId = ctx.params.articleId;
    Bloggify.getArticleById(articleId, (err, data) => {
        if (err) { return ctx.next(null, null, err); }
        if (data.path !== ctx.path) {
            return ctx.redirect(data.path);
        }
        ctx.render(data.metadata.pageTemplate || "article", {
            page: new Article(data)
        });
    });
});

// Blog pages (e.g. /blog/page/2)
Viewer.on("blog_page", ctx => {
    const PATH_ARTICLES = Bloggify.adapter.options.routes.articles
    let pageNumber = ctx.params.pageNumber;
    sameTime([
        cb => Bloggify.getPageBySlug("blog", cb)
      , cb => Bloggify.getArticles({
            page: pageNumber
          , per_page: Bloggify.adapter.options.articles_per_page
        }, cb)
    ], (err, res, pageInfo) => {
        if (err) { return ctx.next(null, null, err); }

        pageInfo = pageInfo[1];
        let blogPage = new Page(res[0]);
        blogPage.articles = res[1].map(c => {
            c.url = `${PATH_ARTICLES}/{id}-{slug}`;
            return new Article(c);
        });

        if (pageInfo.hasNewer) {
            blogPage.newerArticles = `${PATH_ARTICLES}/${pageNumber - 1}`;
        }
        if (pageInfo.hasOlder) {
            blogPage.olderArticles = `${PATH_ARTICLES}/${pageNumber + 1}`;
        }

        ctx.render("blog_page", {
            page: blogPage
          , blogPage: pageNumber
        });
    });
});

// Site pages (Home, Contact, etc)
Viewer.on("site_page", ctx => {
    Bloggify.getPageBySlug(ctx.params.sitePage, (err, data) => {
        if (err) { return ctx.next(null, null, err); }
        if (data.path !== ctx.path) {
            return ctx.redirect(data.path);
        }
        ctx.render(data.metadata.pageTemplate || "site_page", {
            page: new Page(data)
        });
    });
});
