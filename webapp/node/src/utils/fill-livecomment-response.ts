import { PoolConnection, RowDataPacket } from 'mysql2/promise'
import { LivecommentsModel, LivestreamsModel, UserModel } from '../types/models.js'
import { UserResponse, fillUserResponse, fillUserResponses } from './fill-user-response.js'
import {
  LivestreamResponse,
  fillLivestreamResponse,
  fillLivestreamResponses,
} from './fill-livestream-response.js'

export interface LivecommentResponse {
  id: number
  user: UserResponse
  livestream: LivestreamResponse
  comment: string
  tip: number
  created_at: number
}

export const fillLivecommentResponses = async(
  conn: PoolConnection,
  livecomments: LivecommentsModel[],
  getFallbackUserIcon: () => Promise<Readonly<ArrayBuffer>>,
) => {
  const uniqueUserIds = [...new Set(livecomments.map(l => l.user_id))]

  if(uniqueUserIds.length === 0) return []

  const [users] = await conn.query<(UserModel & RowDataPacket)[]>(
    'SELECT * FROM users WHERE id IN ?',
    [[uniqueUserIds]],
  )
  if(users.length !== uniqueUserIds.length) {
    throw new Error("not found user that has the given id")
  }

  const userResponses = await fillUserResponses(conn, users, getFallbackUserIcon)
  const userResponseMap = new Map(userResponses.map(ur => [ur.id, ur]))

  const uniqueLivestreamIds = [...new Set(livecomments.map(r => r.livestream_id))]
  const [livestreams] = await conn.query<(LivestreamsModel & RowDataPacket)[]>(
    'SELECT * FROM livestreams WHERE id IN ?',
    [[uniqueLivestreamIds]],
  )
  if (livestreams.length !== uniqueLivestreamIds.length) throw new Error(`not found livestream that has the given id`)

  const livesteramResponses = await fillLivestreamResponses(
    conn,
    livestreams,
    getFallbackUserIcon
  )
  const livestreamResposeMap = new Map(livesteramResponses.map(lr => [lr.id, lr]))

  const responses = livecomments.map(livecomment => {
    const userResponse = userResponseMap.get(livecomment.user_id)!
    const livestreamResponse = livestreamResposeMap.get(livecomment.livestream_id)!

    return {
      id: livecomment.id,
      user: userResponse,
      livestream: livestreamResponse,
      comment: livecomment.comment,
      tip: livecomment.tip,
      created_at: livecomment.created_at,
    } satisfies LivecommentResponse
  })

  return responses
}

export const fillLivecommentResponse = async (
  conn: PoolConnection,
  livecomment: LivecommentsModel,
  getFallbackUserIcon: () => Promise<Readonly<ArrayBuffer>>,
) => {
  const [[user]] = await conn.query<(UserModel & RowDataPacket)[]>(
    'SELECT * FROM users WHERE id = ?',
    [livecomment.user_id],
  )
  if (!user) throw new Error('not found user that has the given id')

  const userResponse = await fillUserResponse(conn, user, getFallbackUserIcon)

  const [[livestream]] = await conn.query<(LivestreamsModel & RowDataPacket)[]>(
    'SELECT * FROM livestreams WHERE id = ?',
    [livecomment.livestream_id],
  )
  if (!livestream) throw new Error('not found livestream that has the given id')

  const livestreamResponse = await fillLivestreamResponse(
    conn,
    livestream,
    getFallbackUserIcon,
  )

  return {
    id: livecomment.id,
    user: userResponse,
    livestream: livestreamResponse,
    comment: livecomment.comment,
    tip: livecomment.tip,
    created_at: livecomment.created_at,
  } satisfies LivecommentResponse
}
