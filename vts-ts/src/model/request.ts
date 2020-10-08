import { Message, Metadata } from './engine'

export default class VtsRequest {
  public _id: string
  public cachePurged: boolean
  public engine: string
  public interval: number
  public intervalUnit: string
  public messages: Array<Message>
  public metadata: Metadata
  public name: string
  public nextRunTime: Date
  public priority: number
  public processors: Array<any>
  public public: boolean
  public scheduledTask: boolean
  public status: string
  public tags: Array<any>
  public description: string

  constructor (blob: any) {
    this._id = blob._id || null
    this.cachePurged = blob.cachePurged || null
    this.engine = blob.engine || null
    this.interval = blob.interval || null
    this.intervalUnit = blob.intervalUnit || null
    this.messages = blob.messages || []
    this.metadata = blob.metadata || null
    this.name = blob.name || null
    this.nextRunTime = blob.nextRunTime || null
    this.priority = blob.priority || null
    this.processors = blob.processors || []
    this.public = blob.public || null
    this.scheduledTask = blob.scheduledTask || null
    this.status = blob.status || null
    this.tags = blob.tags || null
    this.description = blob.description || null
  }
}
