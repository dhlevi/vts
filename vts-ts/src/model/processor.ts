import { Message } from './engine'

export default class Processor {
  public type: string
  public processed = false
  public name: string
  public x = 0
  public y = 0
  public messages: Array<Message> = []
  public inputNodes: any = {}
  public outputNodes: any = {}
  public attributes: any = {}

  constructor (type: string, name: string) {
    this.type = type || ''
    this.name = name || ''

    this.outputNodes.features = []
    this.inputNodes.features = []
  }
}
