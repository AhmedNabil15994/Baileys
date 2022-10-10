export default interface WLProductInterface {
  id: string,
  name: string,
  description: string,
  price: number,
  currency: string,
  isHidden: boolean,
  imageUrls: {
    requested: string,
    original: string,
  },
  reviewStatus: {
    whatsapp: string,
  },
  availability: string,
  retailerId?:string,
  url?:string
}