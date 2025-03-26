export interface Post {
    _id: string
    title: string
    content: string
    author: {
      id: string
      name: string
    }
    createdAt: string
    comments: Comment[]
  }
  
  export interface Comment {
    _id: string
    content: string
    author: {
      id: string
      name: string
    }
    createdAt: string
  }