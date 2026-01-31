import moment from 'moment';

export interface HackerNewsItem {
  id: number;
  deleted?: boolean;
  type: 'job' | 'story' | 'comment' | 'poll' | 'pollopt';
  by: string;
  time: number;
  text: string;
  dead?: boolean;
  parent: number;
  poll: number;
  kids?: number[];
  url?: string;
  score: number;
  title: string;
  parts?: any[];
  descendants: number;
}

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
  parts?: any[];
}

export interface User {
   about?: string;
   created_time: number;
   created: string;
   id: string;
   karma: number;
}

export interface HackerNewsItemTree {
   item: HackerNewsItem;
   comments: (HackerNewsItemTree | null)[];
}

export const typeMapping: { [key: string]: string } = { story: 'link' };

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

  if (item.type == 'job') {
    story.user = story.points = null;
  }

  if (item.type === 'story' && story.url!.match(/^item/i) && item.title.match(/^ask/i)) {
    story.type = 'ask';
  }
  return story;
};

function cleanText(html: string): string {
  if (!html) { return '' };
  html = html.replace(/<\/p>/ig, '');
  if (!html.match(/^<p>/i)){ html = '<p>' + html; }
  return html;
}

function parseUrl(item: HackerNewsItem, story: any) {
  if (item.url) {
    story.url = item.url;
    // URL parsing without the 'url' module to keep it isomorphic/lightweight if possible
    try {
        const hostname = new URL(item.url).hostname.replace(/^www\./i, '');
        story.domain = hostname;
    } catch (e) {
        story.domain = '';
    }
  } else {
    story.url = 'item?id=' + item.id;
  }
  return story;
}

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
      level,
      parts: item.parts
   };

   mappedItem = parseUrl(item, mappedItem);

   if (item.type == 'job') {
     mappedItem.user = null;
     mappedItem.points = null;
   }

   return mappedItem;
}

export function itemMap(tree: HackerNewsItemTree) {
  const root = itemTransform(tree);
  const { level, ...rootWithoutLevel } = root;
  const rootWithComments = { ...rootWithoutLevel, comments: recurseCommentTree(tree, 0) };
  rootWithComments.comments_count = rootWithComments.comments.reduce((acc, i) => {
    return acc += i.comments_count;
  }, 0) + rootWithComments.comments.length;
  return rootWithComments;
}

function recurseCommentTree(tree: HackerNewsItemTree, level = 0) {
  let items: Item[] = []
  tree.comments.forEach(comment => {
    if(comment === null) { return; }
    let mappedItem = itemTransform(comment, level);
    if(comment.comments) {
      mappedItem.comments = recurseCommentTree(comment, level + 1).filter(c => c !== null);
      mappedItem.comments_count = mappedItem.comments.length;
    }
    mappedItem.comments_count += mappedItem.comments
      .map(i => i.comments_count).reduce((acc, i) => acc += i, 0);
    items = [...items, mappedItem];
  });
  return items;
}
