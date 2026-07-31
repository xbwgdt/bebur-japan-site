import { pageBlocks } from "./blocks";
import news from "./news";
import page from "./page";
import product from "./product";
import siteSettings from "./siteSettings";

export const schemaTypes = [product, news, page, siteSettings, ...pageBlocks];
