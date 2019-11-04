/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var config = require('config');
var winston = require('winston');
var _ = require('lodash');
var FBreakingNewsItem = require('../models/FBreakingNewsItem.js').getModel();

/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (APPS MODULES) *******************************
******************************************************************************/
var Util = require('../util/Utils.js');

/*****************************************************************************
*********************************** BEGIN ************************************
******************************************************************************/
module.exports.run = async function () {
   winston.info("************migrateFBreakingNewsItem");

   //fixed breaking news 1
   fBreakingNewsItem = new FBreakingNewsItem();
   fBreakingNewsItem.headline = "Headline 1";
   fBreakingNewsItem.headlineIcon = "ion-ios7-people";
   fBreakingNewsItem.title = "Fixed breaking news 1";
   fBreakingNewsItem.date = new Date();
   fBreakingNewsItem.views = 0;
   fBreakingNewsItem.type = "link";
   fBreakingNewsItem.imageFile = "fbreaking_news_1.jpg";
   fBreakingNewsItem.access = { target : "_blank",
                                url : "http://uol.com.br"
                              };
   fBreakingNewsItem.order = 1;
   fBreakingNewsItem.deleted = false;
   await fBreakingNewsItem.save();

   //fixed breaking news 2
   fBreakingNewsItem = new FBreakingNewsItem();
   fBreakingNewsItem.headline = "Headline 2";
   fBreakingNewsItem.headlineIcon = "ion-ios7-people";
   fBreakingNewsItem.title = "Fixed breaking news 2";
   fBreakingNewsItem.date = new Date();
   fBreakingNewsItem.views = 0;
   fBreakingNewsItem.type = "link";
   fBreakingNewsItem.imageFile = "fbreaking_news_2.jpg";
   fBreakingNewsItem.access = { target : "_blank",
                                url : "http://uol.com.br"
                              };
   fBreakingNewsItem.order = 2;
   fBreakingNewsItem.deleted = false;
   await fBreakingNewsItem.save();

   //fixed breaking news 3
   fBreakingNewsItem = new FBreakingNewsItem();
   fBreakingNewsItem.headline = "Headline 3";
   fBreakingNewsItem.headlineIcon = "ion-ios7-people";
   fBreakingNewsItem.title = "Fixed breaking news 3";
   fBreakingNewsItem.date = new Date();
   fBreakingNewsItem.views = 0;
   fBreakingNewsItem.type = "link";
   fBreakingNewsItem.imageFile = "fbreaking_news_3.jpg";
   fBreakingNewsItem.access = { target : "_blank",
                                url : "http://uol.com.br"
                              };
   fBreakingNewsItem.order = 3;
   fBreakingNewsItem.deleted = false;
   await fBreakingNewsItem.save();

   return Promise.resolve(true);
}
