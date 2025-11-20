import * as url from 'url';
import moment from 'moment';

export interface HackerNewsItem {
  /** The item's unique id */
  id: number;
  /** true if the item is deleted */
  deleted?: boolean;
  /** The type of item. One of "job", "story", "comment", "poll", or "pollopt" */
  type: 'job' | 'story' | 'comment' | 'poll' | 'pollopt';
  /** The username of the item's author */
  by: string;
  /** Creation date of the item, in Unix Time */
  time: number;
  /** The comment, story or poll text. HTML */
  text: string;
  /** true if the item is dead */
  dead?: boolean;
  /** The comment's parent: either another comment or the relevant story */
  parent: number;
  /** The pollopt's associated poll */
  poll: number;
  /** The ids of the item's comments, in ranked display order */
  kids?: number[];
  /** The URL of the story */
  url?: string;
  /** The story's score, or the votes for a pollopt */
  score: number;
  /** The title of the story, poll or job */
  title: string;
  /** A list of related pollopts, in display order */
  parts?: number[];
  /** In the case of stories or polls, the total comment count */
  descendants: number;
}

/**
 * UI friendly "story" representation. Based on the HackerNewsItem which is
 * returned directly from the HN API. Used for feeds like "news", "jobs", 
 * "ask", "show", etc...
 */
export interface Story {
  id: number;
  title: string;
  points?: number | null;
  user?: string | null;
  time: number;
  time_ago: string;
  comments_count: number;
  type: string;
  url?: string;
  domain?: string;
}

/**
 * UI friendly "item" representation. Based on the HackerNewsItem which is
 * returned directly from the HN API. Used mostly to represent comments.
 */
export interface Item {
  id: number;
  title: string;
  points: number | null;
  user: string | null;
  time: number;
  time_ago: string;
  content: string;
  deleted?: boolean;
  dead?: boolean;
  type: string;
  url?: string;
  domain?: string;
  comments: Item[];
  level?: number;
  comments_count: number;
}

export interface User {
   about?: string;
   created_time: number;
   created: string;
   id: string;
   karma: number;  
}

/**
 * Represents a tree of an item and its comments.
 */
export interface HackerNewsItemTree {
   item: HackerNewsItem;
   comments: (HackerNewsItemTree | null)[];
}

export const typeMapping: { [key: string]: string } = { story: 'link' };

/**
 * Map a JSON object from the HN API to a slimmer "story" model
 * @param item 
 */
export const story = (item: HackerNewsItem): Story => {
  let commentsCount = item.descendants || 0;
  let story: Story = {
    id: item.id,
    title: item.title,
    points: item.score,
    user: item.by,
    time: item.time,
    time_ago: moment(item.time*1000).fromNow(),
    comments_count: commentsCount,
    type: typeMapping[item.type] || item.type
  };

  story = parseUrl(item, story);

  // strip user name and points for jobs
  if (item.type == 'job') {
    story.user = story.points = null;
  }  

  // Identify ask type
  if (item.type === 'story' && story.url!.match(/^item/i) && item.title.match(/^ask/i)) {
    story.type = 'ask';
  }
  return story;  
};

/**
 * Remove trailing </p> and prepend <p> tags to comment content html.
 * https://github.com/cheeaun/node-hnapi/blob/master/lib/hnapi.js#L16
 * @param html 
 */
function cleanText(html: string): string {
  if (!html) { return '' };
  html = html.replace(/<\/p>/ig, ''); 
  if (!html.match(/^<p>/i)){ html = '<p>' + html; }
  return html;
}

/**
 * Transform a story item's url and domain to a UI friendly format.
 * @param item
 * @param story 
 */
function parseUrl(item: HackerNewsItem, story: any) {
  if (item.url) {
    story.url = item.url;
    story.domain = url.parse(item.url).hostname!.replace(/^www\./i, '');
  } else {
    story.url = 'item?id=' + item.id;
  }
  return story;
}

/**
 * Transform the HackerNewsItemTree to a UI friendly Item model.
 * @param tree 
 */
export function itemTransform(tree: HackerNewsItemTree, level = 0) {
   const { item } =  tree;
   let mappedItem: Item = {
      id: item.id,
      title: item.title,
      points: item.score,
      user: item.by,
      time: item.time, 
      time_ago: moment(tree.item.time*1000).fromNow(),
      type: typeMapping[item.type] || item.type,
      content: item.deleted ? '[deleted]' : cleanText(item.text),
      deleted: item.deleted,
      dead: item.dead,
      comments: [],
      comments_count: 0,
      level
   };

   mappedItem = parseUrl(item, mappedItem);

   // strip user and points for jobs
   if (item.type == 'job') {
     mappedItem.user = null;
     mappedItem.points = null;
   }

   return mappedItem;
}

/**
 * Tramsforms a HackerNewsItemTree to a UI friendly Item model. This method 
 * does more than you wish it would have to do. The HN API does not return 
 * an accurate number of comments for a "story". Therefore Each tree must
 * be recursed and each item's comment array is reduced up to create the total.
 * @param tree 
 */
export function itemMap(tree: HackerNewsItemTree) {
  const root = itemTransform(tree);
  // root level is a story, not a comment thread
  const { level, ...rootWithoutLevel } = root;
  const rootWithComments = { ...rootWithoutLevel, comments: recurseCommentTree(tree, 0) };
  // gather comments count at root level
  rootWithComments.comments_count = rootWithComments.comments.reduce((acc, i) => {
    return acc += i.comments_count;
  }, 0) + rootWithComments.comments.length;
  return rootWithComments;
}

/**
 * Format and count comment items recursively. Each comment can contain 
 * an array of comments.
 * @param tree 
 * @param level 
 */
function recurseCommentTree(tree: HackerNewsItemTree, level = 0) {
  let items: Item[] = []
  tree.comments.forEach(comment => {
    if(comment === null) { return; }
    let mappedItem = itemTransform(comment, level);
    if(comment.comments) {
      mappedItem.comments = recurseCommentTree(comment, level + 1).filter(c => c !== null);
      mappedItem.comments_count = mappedItem.comments.length;
    }
    // gather comment counts at this level
    mappedItem.comments_count += mappedItem.comments
      .map(i => i.comments_count).reduce((acc, i) => acc += i, 0);
    items = [...items, mappedItem];
  });
  return items;
}
