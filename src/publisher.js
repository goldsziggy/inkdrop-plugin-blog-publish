// inspiration
// https://github.com/jmerle/inkdrop-export-as-gist/blob/master/src/exporter.js
'use babel'
import GhostAdminAPI from '@tryghost/admin-api'
import GhostContentAPI from '@tryghost/content-api'
const showdown = require('showdown')

function getGhostAPIObj() {
  const contentToken = inkdrop.config.get('ghost-publish.ghostContentToken')
  const adminToken = inkdrop.config.get('ghost-publish.ghostAdminToken')
  const url = inkdrop.config.get('ghost-publish.ghostUrl')

  // leaving the content API in here in case there is a need in the future
  return {
    admin: new GhostAdminAPI({
      url,
      key: adminToken,
      version: 'v3',
    }),
    client: new GhostContentAPI({
      url,
      key: contentToken,
      version: 'v3',
    }),
  }
}

export async function publishToGhost() {
  const { noteListBar, notes } = inkdrop.store.getState()
  const noteIds = noteListBar.actionTargetNoteIds

  if (noteIds.length === 0 || Object.keys(notes.hashedItems).length === 0) {
    throw new Error('No note(s) selected.')
  }

  const files = {}

  for (const noteId of noteIds) {
    const note = notes.hashedItems[noteId]
    files[note.title] = { content: note.body }
  }

  try {
    const { noteListBar, notes } = inkdrop.store.getState()
    const noteIds = noteListBar.actionTargetNoteIds

    if (noteIds.length === 0 || Object.keys(notes.hashedItems).length === 0) {
      throw new Error('No note(s) selected.')
    }

    const files = {}

    for (const noteId of noteIds) {
      const note = notes.hashedItems[noteId]
      files[note.title] = { content: note.body }
    }

    const { admin: adminApi, client: clientApi } = getGhostAPIObj()

    const posts = await adminApi.posts.browse()
    const converter = new showdown.Converter()

    for (const [key, value] of Object.entries(files)) {
      const html = converter.makeHtml(value.content)

      const found = posts.find((post) => post.title === key)

      if (found) {
        await adminApi.posts.edit(
          { id: found.id, title: key, html, updated_at: found.updated_at },
          { source: 'html' }
        )
      } else {
        await adminApi.posts.add({ title: key, html }, { source: 'html' })
      }
    }
  } catch (e) {
    console.log('itz broken!', e)
    throw e
  }

  return true
}

export async function syncWithGhost() {
  const { noteListBar, notes } = inkdrop.store.getState()
  const noteIds = noteListBar.actionTargetNoteIds

  if (noteIds.length === 0 || Object.keys(notes.hashedItems).length === 0) {
    throw new Error('No note(s) selected.')
  }

  const files = {}

  for (const noteId of noteIds) {
    const note = notes.hashedItems[noteId]
    files[note.title] = { content: note.body }
  }

  try {
    const { noteListBar, notes } = inkdrop.store.getState()
    const { cm } = inkdrop.getActiveEditor()

    console.log({ cm })
    const noteIds = noteListBar.actionTargetNoteIds

    if (noteIds.length === 0 || Object.keys(notes.hashedItems).length === 0) {
      throw new Error('No note(s) selected.')
    }

    const files = {}

    for (const noteId of noteIds) {
      const note = notes.hashedItems[noteId]
      files[note.title] = { content: note.body }
    }

    const { admin: adminApi } = getGhostAPIObj()

    const posts = await adminApi.posts.browse({ formats: ['html'] })
    const converter = new showdown.Converter()

    for (const [key, value] of Object.entries(files)) {
      const found = posts.find((post) => post.title === key)
      console.log({ key })
      if (found) {
        const md = converter.makeMarkdown(found.html)

        cm.doc.setValue(md)
      }
    }
  } catch (e) {
    console.log('itz broken!', e)
    throw e
  }

  return true
}
