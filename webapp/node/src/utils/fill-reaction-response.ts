import { PoolConnection, RowDataPacket } from 'mysql2/promise'
import { LivestreamsModel, ReactionsModel, UserModel } from '../types/models.js'
import {
  LivestreamResponse,
  fillLivestreamResponse,
  fillLivestreamResponses,
} from './fill-livestream-response.js'
import { UserResponse, fillUserResponse, fillUserResponses } from './fill-user-response.js'

export interface ReactionResponse {
  id: number
  emoji_name: string
  user: UserResponse
  livestream: LivestreamResponse
  created_at: number
}

export const fillReactionResponses = async(
  conn: PoolConnection,
  reactions: ReactionsModel[],
  getFallbackUserIcon: () => Promise<Readonly<ArrayBuffer>>
) => {
  if(reactions.length === 0) return []

  const uniqueUserIds = [...new Set(reactions.map(r => r.user_id))]
  const uniqueLivestreamIds = [...new Set(reactions.map(r => r.livestream_id))]

  const [[users], [livestreams]] = await Promise.all([
    conn.query<(UserModel & RowDataPacket)[]>(
      'SELECT * FROM users WHERE id IN ?',
      [[uniqueUserIds]],
    ),
    conn.query<(LivestreamsModel & RowDataPacket)[]>(
      'SELECT * FROM livestreams WHERE id IN ?',
      [[uniqueLivestreamIds]],
    ) 
  ])


  if(users.length !== uniqueUserIds.length) {
    throw new Error("not found user that has the given id")
  }
  if (livestreams.length !== uniqueLivestreamIds.length) throw new Error(`not found livestream that has the given id`)

  const userResponses = await fillUserResponses(conn, users, getFallbackUserIcon)
  const userResponseMap = new Map(userResponses.map(u => [u.id, u]))

  const livestreamResponses = await fillLivestreamResponses(conn, livestreams, getFallbackUserIcon)
  const livestreamResponseMap = await new Map(livestreamResponses.map(l => [l.id, l]))


  const responses: ReactionResponse[] = reactions.map(reaction => {
    const userResponse = userResponseMap.get(reaction.user_id)!
    const livestreamResponse = livestreamResponseMap.get(reaction.livestream_id)!


    return {
      id: reaction.id,
      emoji_name: reaction.emoji_name,
      user: userResponse,
      livestream: livestreamResponse,
      created_at: reaction.created_at,
    } satisfies ReactionResponse
  })

  return responses

}

export const fillReactionResponse = async (
  conn: PoolConnection,
  reaction: ReactionsModel,
  getFallbackUserIcon: () => Promise<Readonly<ArrayBuffer>>,
) => {
  const [[user]] = await conn.query<(UserModel & RowDataPacket)[]>(
    'SELECT * FROM users WHERE id = ?',
    [reaction.user_id],
  )
  if (!user) throw new Error('not found user that has the given id')

  const userResponse = await fillUserResponse(conn, user, getFallbackUserIcon)

  const [[livestream]] = await conn.query<(LivestreamsModel & RowDataPacket)[]>(
    'SELECT * FROM livestreams WHERE id = ?',
    [reaction.livestream_id],
  )
  if (!livestream) throw new Error(`not found livestream that has the given id`)

  const livestreamResponse = await fillLivestreamResponse(
    conn,
    livestream,
    getFallbackUserIcon,
  )

  return {
    id: reaction.id,
    emoji_name: reaction.emoji_name,
    user: userResponse,
    livestream: livestreamResponse,
    created_at: reaction.created_at,
  } satisfies ReactionResponse
}
