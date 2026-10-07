export interface Driver {
  id: number;
  nom: string;
  prenom: string;
}

export interface DriversDatabase {
  drivers: Driver[];
}
