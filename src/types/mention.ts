import { Post } from './post';
import { Employee } from './employee';

export interface CompanyMention {
  id: string;
  postId: string;
  post: Post;
  author: Employee;
  rank: number;
}
