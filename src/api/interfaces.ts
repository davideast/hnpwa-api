import * as url from 'url';

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
  url?: string;
  /** The story's score, or the votes for a pollopt */
  score: number;
  /** The title of the story, poll or job */
  title: string;
  /** A list of related pollopts, in display order */
  parts: number[];
  /** In the case of stories or polls, the total comment count */
  descendants: number;
}

export interface Story {
  id: number;
  title: string;
  points: number | null;
  user: string | null;
  time: number;
  time_ago: string;
  comments_count: number;
  type: string;
  url?: string;
  domain?: string;
}

export const story = (item: HackerNewsItem): Story => {
  const typeMapping: { [key: string]: string } = { story: 'link' };
  let commentsCount = item.descendants || 0;
  let story: Story = {
    id: item.id,
    title: item.title,
    points: item.score,
    user: item.by,
    time: item.time,
    time_ago: "sometime ago",
    comments_count: commentsCount,
    type: typeMapping[item.type] || item.type
  };

  if (item.url) {
    story.url = item.url;
    story.domain = url.parse(item.url).hostname!.replace(/^www\./i, '');
  } else {
    story.url = 'item?id=' + item.id; // Simulate "local" links
  }  

  // strip user name and points for jobs
  if (item.type == 'job') {
    story.user = story.points = null;
  }  

  // Identify type=ask
  if (item.type === 'story' && story.url.match(/^item/i) && item.title.match(/^ask/i)) {
    story.type = 'ask';
  }
  return story;  
};
