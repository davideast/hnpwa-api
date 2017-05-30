
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
  kids: number[];
  /** The URL of the story */
  url: string;
  /** The story's score, or the votes for a pollopt */
  score: number;
  /** The title of the story, poll or job */
  title: string;
  /** A list of related pollopts, in display order */
  parts: number[];
  /** In the case of stories or polls, the total comment count */
  descendants: number[];
}