import axios from 'axios'
import { login } from '../src/api/auth'

jest.mock('axios')

describe('auth API', () => {
  it('successfully logs in', async () => {
    const mockResponse = { data: { token: 'fake-token' } }
    axios.post.mockResolvedValue(mockResponse)

    const result = await login('test@example.com', 'password123')
    expect(result).toEqual(mockResponse.data)
  })
})

