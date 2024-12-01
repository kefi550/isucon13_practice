import { PoolConnection, RowDataPacket } from 'mysql2/promise'
import {
  LivecommentReportsModel,
  LivecommentsModel,
  UserModel,
} from '../types/models.js'
import { UserResponse, fillUserResponse, fillUserResponses } from './fill-user-response.js'
import {
  LivecommentResponse,
  fillLivecommentResponse,
  fillLivecommentResponses,
} from './fill-livecomment-response.js'

export interface LivecommentReportResponse {
  id: number
  reporter: UserResponse
  livecomment: LivecommentResponse
  created_at: number
}

export const fillLivecommentReportResponses = async (
  conn: PoolConnection,
  livecommentReports: LivecommentReportsModel[],
  getFallbackUserIcon: () => Promise<Readonly<ArrayBuffer>>,
) => {
  const uniqueUserIds = [...new Set(livecommentReports.map(l => l.user_id))]

  if(uniqueUserIds.length === 0) return []

  const [users] = await conn.query<(UserModel & RowDataPacket)[]>(
    'SELECT * FROM users WHERE id IN (?)',
    [[uniqueUserIds]],
  )
  if(users.length !== uniqueUserIds.length) {
    throw new Error("not found user that has the given id")
  }

  const userResponses = await fillUserResponses(conn, users, getFallbackUserIcon)
  const userResponseMap = new Map(userResponses.map(ur => [ur.id, ur]))

  const uniqueLivecommentId = [...new Set(livecommentReports.map(l => l.livecomment_id))]

  const [livecomments] = await conn.query<(LivecommentsModel & RowDataPacket)[]>(
    'SELECT * FROM livecomments WHERE id IN ?', 
    [[uniqueLivecommentId]]
  )
  if (livecomments.length !== uniqueLivecommentId.length)
    throw new Error('not found livecomment that has the given id')

  const livecommentResponses = await fillLivecommentResponses(conn, livecomments, getFallbackUserIcon)
  const livecommentResponseMap = new Map(livecommentResponses.map(lr => [lr.id, lr]))

  const responses: LivecommentReportResponse[] = livecommentReports.map(livecommentReport => {

    const userResponse = userResponseMap.get(livecommentReport.user_id)!
    const livecommentResponse = livecommentResponseMap.get(livecommentReport.livecomment_id)!

    return {
      id: livecommentReport.id,
      reporter: userResponse,
      livecomment: livecommentResponse,
      created_at: livecommentReport.created_at, 
    }
  })

  return responses

}

export const fillLivecommentReportResponse = async (
  conn: PoolConnection,
  livecommentReport: LivecommentReportsModel,
  getFallbackUserIcon: () => Promise<Readonly<ArrayBuffer>>,
) => {
  const [[user]] = await conn.query<(UserModel & RowDataPacket)[]>(
    'SELECT * FROM users WHERE id = ?',
    [livecommentReport.user_id],
  )
  if (!user) throw new Error('not found user that has the given id')

  const userResponse = await fillUserResponse(conn, user, getFallbackUserIcon)

  const [[livecomment]] = await conn.query<
    (LivecommentsModel & RowDataPacket)[]
  >('SELECT * FROM livecomments WHERE id = ?', [
    livecommentReport.livecomment_id,
  ])
  if (!livecomment)
    throw new Error('not found livecomment that has the given id')

  const livecommentResponse = await fillLivecommentResponse(
    conn,
    livecomment,
    getFallbackUserIcon,
  )

  return {
    id: livecommentReport.id,
    reporter: userResponse,
    livecomment: livecommentResponse,
    created_at: livecommentReport.created_at,
  } satisfies LivecommentReportResponse
}
