export interface Config {
  name: string;
  age: string;
  zodiac: string;
  avatarUrl: string;
  emjoi: string;
  infoTags: {
    sex: string;
    school: string;
    province: string;
  };
  professions: string[];
}

export interface LinkBtn {
  icon: string;
  text: string;
  color: string;
  url: string;
}

export interface LinkBtns {
  linkBtn: LinkBtn[];
}

export interface TechStack {
  icon: string;
  name: string;
}

export interface TechStacks {
  techStack: TechStack[];
}

export interface TodoItem {
  text: string;
  checked: boolean;
}

export interface Todo {
  todoList: TodoItem[];
}

export interface Typewriter {
  default: string[];
}
