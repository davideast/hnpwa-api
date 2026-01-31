import { HackerNewsItem, HackerNewsItemTree, Item, itemMap, Story, story, User } from './types';
import moment from 'moment';

export class HnClient {
  private baseUrl = 'https://hacker-news.firebaseio.com/v0';

  constructor() {}

  private async fetchItem(id: number): Promise<HackerNewsItem | null> {
    const response = await fetch(`${this.baseUrl}/item/${id}.json`);
    if (!response.ok) return null;
    return await response.json();
  }

  async getItem(id: number): Promise<Item | null> {
    const tree = await this.getItemAndComments(id);
    if (!tree) return null;
    return itemMap(tree);
  }

  private async getItemAndComments(id: number): Promise<HackerNewsItemTree | null> {
    const item = await this.fetchItem(id);
    if (!item) return null;

    let comments: (HackerNewsItemTree | null)[] = [];
    if (item.kids && item.kids.length) {
      comments = await Promise.all(item.kids.map(kid => this.getItemAndComments(kid)));
    }

    // Clone item to avoid modifying the original response if cached (though here it's fresh)
    const itemCopy = { ...item };
    delete itemCopy.kids;

    if (itemCopy.type === 'poll' && itemCopy.parts && itemCopy.parts.length) {
       const pollParts = await Promise.all(itemCopy.parts.map((part: any) => this.getItemAndComments(part)));
       itemCopy.parts = pollParts.map(p => p ? p.item : null).filter(p => p !== null);
    } else {
       delete itemCopy.parts;
    }

    return {
      item: itemCopy,
      comments
    };
  }

  async getUser(id: string): Promise<User | null> {
    const response = await fetch(`${this.baseUrl}/user/${id}.json`);
    if (!response.ok) return null;
    const user = await response.json();
    if (user && user.id) {
       return {
          about: user.about,
          created_time: user.created,
          created: moment(user.created * 1000).fromNow(),
          id: user.id,
          karma: user.karma
       };
    }
    return null;
  }

  async getStories(topic: string, page: number = 1): Promise<Story[]> {
    const limit = 30;
    const response = await fetch(`${this.baseUrl}/${topic}.json`);
    if (!response.ok) return [];
    const allIds: number[] = await response.json();

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const ids = allIds.slice(startIndex, endIndex);

    const promises = ids.map(id => this.fetchItem(id));
    const items = await Promise.all(promises);

    return items
      .filter((item): item is HackerNewsItem => item !== null)
      .map(item => story(item));
  }
}
