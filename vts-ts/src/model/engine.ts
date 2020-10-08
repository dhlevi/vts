export class Message {
  public message: string
  public sender: string
  public timestamp: Date

  constructor (message: string, sender: string, timestamp: Date) {
    this.message = message || ''
    this.sender = sender || ''
    this.timestamp = timestamp || Date.now()
  }
}

export class Metadata {
  public createdBy: string
  public lastUpdatedBy: string
  public createdDate: Date
  public lastUpdatedDate: Date
  public history: Array<any>
  public revision: number

  constructor (blob: any) {
    this.createdBy = blob.createdBy || null
    this.lastUpdatedBy = blob.lastUpdatedBy || null
    this.createdDate = blob.createdDate || null
    this.lastUpdatedDate = blob.lastUpdatedDate || null
    this.history = blob.history || []
    this.revision = blob.revision || null
  }
}

export default class Engine {
  public _id: string
  public id: string
  public route: string
  public acceptsRequests: boolean
  public acceptsScheduledTasks: boolean
  public currentState: string
  public requestedState: string
  public messages: Array<Message>
  public tags: Array<any>
  public metadata: Metadata
  public runningRequests: Array<number>
  public queuedRequests: Array<number>
  public uptime: number
  public totalRequests: number
  public maxMemory: number
  public usedMemory: number
  public alive: boolean

  constructor (blob: any) {
    this._id = blob._id || null
    this.id = blob.id || null
    this.route = blob.route || null
    this.acceptsRequests = blob.acceptsRequests || null
    this.acceptsScheduledTasks = blob.acceptsScheduledTasks || null
    this.currentState = blob.currentState || null
    this.requestedState = blob.requestedState || null
    this.messages = blob._id || []
    this.tags = blob.tags || []
    this.metadata = blob.metadata || null
    this.runningRequests = blob.runningRequests || []
    this.queuedRequests = blob.queuedRequests || []
    this.uptime = blob.uptime || null
    this.totalRequests = blob.totalRequests || null
    this.maxMemory = blob.maxMemory || null
    this.usedMemory = blob.usedMemory || null
    this.alive = blob.alive || null
  }
}
