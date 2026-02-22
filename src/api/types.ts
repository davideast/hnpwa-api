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
  parts?: any[];
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
  parts?: any[];
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
