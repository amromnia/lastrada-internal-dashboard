import { PackageTypeDB } from "./packageTypeDB";

export interface PackageData {
  packageType: PackageTypeDB;
  guests?: number;
  classicPizzas?: number;
  signaturePizzas?: number;
  subtotal: number;
}