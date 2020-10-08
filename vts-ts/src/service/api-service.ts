import AuthenticatedUser from '@/model/authenticated-user'

export default class API {
  private static url = 'http://localhost:9988/' // UI microservice URL, not the ENGINE microservice URL!!!

  public static async login (user: string, password: string): Promise<any> {
    const headers = {
      'Content-Type': 'application/json'
    }

    const body = {
      name: user,
      password: password
    }

    const response = await this.postRequest('Users/Login', body, headers)

    if (response.status === 201) {
      return new AuthenticatedUser(await response.json())
    } else {
      return null
    }
  }

  public static async fetchUsers (user: AuthenticatedUser) {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user.accessToken}`
    }

    const response = await this.getRequest('Users', headers)

    if (response.status === 200) {
      return await response.json()
    } else {
      return null
    }
  }

  public static async createUser (user: AuthenticatedUser, newUser: AuthenticatedUser) {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user.accessToken}`
    }

    const response = await this.postRequest('Users', newUser, headers)

    if (response.status === 201) {
      return await response.json()
    } else {
      return null
    }
  }

  public static async updateUser (user: AuthenticatedUser, existingUser: AuthenticatedUser) {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user.accessToken}`
    }

    console.log(existingUser)

    const response = await this.putRequest(`Users/${existingUser._id}`, existingUser, headers)

    if (response.status === 201) {
      return await response.json()
    } else {
      return null
    }
  }

  public static async deleteUser (user: AuthenticatedUser, existingUser: AuthenticatedUser) {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user.accessToken}`
    }

    const response = await this.deleteRequest(`Users/${existingUser._id}`, headers)

    if (response.status === 200) {
      return await response.json()
    } else {
      return null
    }
  }

  public static async fetchEngines (user: AuthenticatedUser): Promise<any> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user.accessToken}`
    }

    const response = await this.getRequest('Engines', headers)

    if (response.status === 200) {
      return await response.json()
    } else {
      return null
    }
  }

  public static async fetchEngine (user: AuthenticatedUser, route: string): Promise<any> {
    const request: any = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.accessToken}`
      }
    }

    const response = await fetch(route, request)

    if (response.status === 200) {
      return await response.json()
    } else {
      return null
    }
  }

  public static async fetchRequestCounts (user: AuthenticatedUser): Promise<any> {
    const response = await this.getRequest('Requests/Counts', {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user.accessToken}`
    })

    if (response.status === 200) {
      return await response.json()
    } else {
      return null
    }
  }

  public static async fetchScheduledTasks (user: AuthenticatedUser): Promise<any> {
    const response = await this.getRequest('Requests?tasks=true', {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user.accessToken}`
    })

    if (response.status === 200) {
      return await response.json()
    } else {
      return null
    }
  }

  public static async startupEngine (user: AuthenticatedUser, engineId: string): Promise<any> {
    const response = await this.putRequest(`Engines/${engineId}/Start`, null, {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user.accessToken}`
    })

    if (response.status === 200) {
      return await response.json()
    } else {
      return null
    }
  }

  public static async shutdownEngine (user: AuthenticatedUser, engineId: string): Promise<any> {
    const response = await this.putRequest(`Engines/${engineId}/Stop`, null, {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user.accessToken}`
    })

    if (response.status === 200) {
      return await response.json()
    } else {
      return null
    }
  }

  public static putRequest (path: string, body: any, headers: any): Promise<Response> {
    return this.request(path, 'PUT', body, headers)
  }

  public static deleteRequest (path: string, headers: any): Promise<Response> {
    return this.request(path, 'DELETE', null, headers)
  }

  public static getRequest (path: string, headers: any): Promise<Response> {
    return this.request(path, 'GET', null, headers)
  }

  public static postRequest (path: string, body: any, headers: any): Promise<Response> {
    return this.request(path, 'POST', body, headers)
  }

  public static request (path: string, type: string, body: any, headers: any): Promise<Response> {
    const request: any = {
      method: type,
      headers: headers
    }

    if (body && (type === 'POST' || type === 'PUT')) {
      request.body = JSON.stringify(body)
    }

    return fetch(`${this.url}${path}`, request)
  }
}
