import { createHash } from 'node:crypto'
import { PoolConnection, RowDataPacket } from 'mysql2/promise'
import { IconModel, ThemeModel, UserModel } from '../types/models.js'

export interface UserResponse {
  id: number
  name: string
  display_name: string
  description: string
  theme: {
    id: number
    dark_mode: boolean
  }
  icon_hash: string
}


export const fillUserResponses = async(
  conn: PoolConnection,
  users: UserModel[],
  getFallbackUserIcon: () => Promise<Readonly<ArrayBuffer>>,
) => {
  if(users.length === 0) return []

  const uniqueUserIds = [...new Set(users.map(u => u.id))]

  const [[themes], [icons], fallbackUserIcon] = await Promise.all([
    conn.query<(ThemeModel & RowDataPacket)[]>(
      'SELECT * FROM themes WHERE user_id IN ?',
      [[uniqueUserIds]],
    ),
    conn.query<(Pick<IconModel, 'user_id' | 'image'> & RowDataPacket)[]>(
      'SELECT user_id, image FROM icons WHERE user_id IN ?', [[uniqueUserIds]]
    ),
    getFallbackUserIcon()
  ])

  const themeUserMap = new Map<number, typeof themes[0]>(themes.map(t => [t.user_id, t]));
  const iconUserMap = new Map<number, typeof icons[0]>(icons.map(i => [i.user_id, i]))

  const responses: UserResponse[] = users.map(user => {
    const theme = themeUserMap.get(user.id)!
    const image = iconUserMap.get(user.id)?.image ?? fallbackUserIcon

    return {
      id: user.id,
      name: user.name,
      display_name: user.display_name,
      description: user.description,
      theme: {
        id: theme.id,
        dark_mode: !!theme.dark_mode,
      },
      icon_hash: createHash('sha256').update(new Uint8Array(image)).digest('hex'), 
    }
  })

  return responses
}

export const fillUserResponse = async (
  conn: PoolConnection,
  user: Omit<UserModel, 'password'>,
  getFallbackUserIcon: () => Promise<Readonly<ArrayBuffer>>,
) => {
  const [[theme]] = await conn.query<(ThemeModel & RowDataPacket)[]>(
    'SELECT * FROM themes WHERE user_id = ?',
    [user.id],
  )

  const [[icon]] = await conn.query<
    (Pick<IconModel, 'image'> & RowDataPacket)[]
  >('SELECT image FROM icons WHERE user_id = ?', [user.id])

  let image = icon?.image

  if (!image) {
    image = await getFallbackUserIcon()
  }

  return {
    id: user.id,
    name: user.name,
    display_name: user.display_name,
    description: user.description,
    theme: {
      id: theme.id,
      dark_mode: !!theme.dark_mode,
    },
    icon_hash: createHash('sha256').update(new Uint8Array(image)).digest('hex'),
  } satisfies UserResponse
}
