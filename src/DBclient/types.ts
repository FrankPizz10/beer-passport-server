interface AddUser {
  uid: string;
  email: string;
  age: number;
  user_name: string;
}

interface Beer {
  id: number;
  brewery_id: number;
  name: string;
  cat_id: number;
  style_id: number;
  abv: number;
  ibu: number;
  srm: number;
  upc: number;
  filepath: string;
  descript: string;
  add_user: number;
  last_mod: Date;
  collection_id: number;
}

interface CreateBeer {
  brewery_id?: number;
  name: string;
  cat_id?: number;
  style_id?: number;
  abv?: number;
  ibu?: number;
  srm?: number;
  upc?: number;
  descript: string;
}

interface UserBeer {
  user_id: number;
  beer_id: number;
  liked: boolean;
  collection_id?: number;
}

interface UserBadge {
  user_id: number;
  collection_id: number;
  earned: boolean;
  progress: number;
}

interface CreateCollection {
  name: string;
  difficulty: number;
  description: string;
}

interface AddBeerToCollection {
  beer_id: number;
  collection_id: number;
}
