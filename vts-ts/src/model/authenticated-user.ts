export default class AuthenticatedUser {
  public userId: string|null
  public _id: string|null
  public email: string|null
  public role: string|null
  public provider: string|null
  public password: string|null
  public name: string|null
  public stamp: number|null
  public refreshKey: string|null
  public accessToken: string|null
  public refreshToken: string|null

  constructor (blob: any) {
    this._id = blob._id || null
    this.userId = blob.userId || null
    this.email = blob.email || null
    this.role = blob.role || null
    this.provider = blob.provider || null
    this.password = blob.password || null
    this.name = blob.name || null
    this.stamp = blob.stamp || null
    this.refreshKey = blob.refreshKey || null
    this.accessToken = blob.accessToken || null
    this.refreshToken = blob.refreshToken || null
  }
}
