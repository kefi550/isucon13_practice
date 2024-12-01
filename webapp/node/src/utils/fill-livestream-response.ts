import { PoolConnection, RowDataPacket } from 'mysql2/promise'
import {
  LivestreamTagsModel,
  LivestreamsModel,
  TagsModel,
  UserModel,
} from '../types/models.js'
import { UserResponse, fillUserResponse, fillUserResponses } from './fill-user-response.js'

export interface LivestreamResponse {
  id: number
  owner: UserResponse
  title: string
  tags: { id: number; name: string }[]
  description: string
  playlist_url: string
  thumbnail_url: string
  start_at: number
  end_at: number
}

export const fillLivestreamResponses = async (
  conn: PoolConnection,
  livestreams: LivestreamsModel[],
  getFallbackUserIcon: () => Promise<Readonly<ArrayBuffer>>,
) => {
  const uniqueUserIds = [...new Set(livestreams.map(r => r.user_id))]

  if(uniqueUserIds.length === 0) return []

  const [users] = await conn.query<(UserModel & RowDataPacket)[]>(
    'SELECT * FROM users WHERE id IN ?',
    [[uniqueUserIds]],
  )
  if(users.length !== uniqueUserIds.length) {
    throw new Error("not found user that has the given id")
  }

  const userResponses = await fillUserResponses(conn, users, getFallbackUserIcon)
  const userMap = new Map(userResponses.map(u => [u.id, u]))

  const uniqueLivestreamIds = [...new Set(livestreams.map(l => l.id))]
  const [tags] = await conn.query<(TagsModel & Pick<LivestreamTagsModel, 'livestream_id'> & RowDataPacket)[]>(
    `
      SELECT 
        tags.id,
        tags.name,
        livestream_tags.livestream_id
      FROM 
        tags
      INNER JOIN livestream_tags ON tags.id = livestream_tags.tag_id
      WHERE
        livestream_tags.livestream_id IN ?
    `,
    [[uniqueLivestreamIds]]
  )

  // 手続きで書いた方が早いので手続的に書いてる
  const tagMap = new Map<number, typeof tags>()
  {
    tags.forEach(tag => {
      const livestreamTags = tagMap.get(tag.livestream_id)
      if(livestreamTags) {
        livestreamTags.push(tag)
      } else {
        tagMap.set(tag.livestream_id, [tag])
      }
    })
  }

  const responses: LivestreamResponse[] = livestreams.map(livestream => {
    const userResponse = userMap.get(livestream.user_id)!
    const tags = tagMap.get(livestream.id) || []

    return {
      id: livestream.id,
      owner: userResponse,
      title: livestream.title,
      tags: tags.map((tag) => ({ id: tag.id, name: tag.name })),
      description: livestream.description,
      playlist_url: livestream.playlist_url,
      thumbnail_url: livestream.thumbnail_url,
      start_at: livestream.start_at,
      end_at: livestream.end_at,
    } satisfies LivestreamResponse
  })

  return responses
}

export const fillLivestreamResponse = async (
  conn: PoolConnection,
  livestream: LivestreamsModel,
  getFallbackUserIcon: () => Promise<Readonly<ArrayBuffer>>,
) => {
  const [[user]] = await conn.query<(UserModel & RowDataPacket)[]>(
    'SELECT * FROM users WHERE id = ?',
    [livestream.user_id],
  )
  if (!user) throw new Error('not found user that has the given id')

  const userResponse = await fillUserResponse(conn, user, getFallbackUserIcon)

  const [livestreamTags] = await conn.query<
    (LivestreamTagsModel & RowDataPacket)[]
  >('SELECT * FROM livestream_tags WHERE livestream_id = ?', [livestream.id])

  const tags: TagsModel[] = []
  for (const livestreamTag of livestreamTags) {
    const [[tag]] = await conn.query<(TagsModel & RowDataPacket)[]>(
      'SELECT * FROM tags WHERE id = ?',
      [livestreamTag.tag_id],
    )
    tags.push(tag)
  }

  return {
    id: livestream.id,
    owner: userResponse,
    title: livestream.title,
    tags: tags.map((tag) => ({ id: tag.id, name: tag.name })),
    description: livestream.description,
    playlist_url: livestream.playlist_url,
    thumbnail_url: livestream.thumbnail_url,
    start_at: livestream.start_at,
    end_at: livestream.end_at,
  } satisfies LivestreamResponse
}
