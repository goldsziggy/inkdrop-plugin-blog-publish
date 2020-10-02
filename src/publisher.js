// inspiration
// https://github.com/jmerle/inkdrop-export-as-gist/blob/master/src/exporter.js
'use babel'
import GhostAdminAPI from '@tryghost/admin-api'
import GhostContentAPI from '@tryghost/content-api'
import WPAPI from 'wpapi'
const showdown = require('showdown')

function getWPAPIObj() {
  const endpoint = inkdrop.config.get('blog-publish.wordpressUrl')
  const username = inkdrop.config.get('blog-publish.wordpressUsername')
  const password = inkdrop.config.get('blog-publish.wordpressPassword')

  return new WPAPI({
    endpoint,
    username,
    password,
  })
}

function getGhostAPIObj() {
  const contentToken = inkdrop.config.get('blog-publish.ghostContentToken')
  const adminToken = inkdrop.config.get('blog-publish.ghostAdminToken')
  const url = inkdrop.config.get('blog-publish.ghostUrl')

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

function getPosts(blogType) {
  if (blogType === 'WP') {
    const api = getWPAPIObj()
    return api.posts()
  } else if (blogType === 'GHOST') {
    const { admin: adminApi } = getGhostAPIObj()
    return adminApi.posts.browse({ limit: 'all', formats: ['html'] })
  }
  throw new Error('Unsupported blog-type in getPosts')
}

function findPostWithTitle({ blogType, posts, title }) {
  if (blogType === 'WP') {
    return posts.find((post) => post.title.rendered === title)
  } else if (blogType === 'GHOST') {
    return posts.find((post) => post.title === title)
  }

  throw new Error('Unsupported blog-type in findPostWithTitle')
}

function getPostHTML({ blogType, post }) {
  if (blogType === 'WP') {
    return post.content.rendered
  } else if (blogType === 'GHOST') {
    console.log({ post })
    return post.html
  }

  throw new Error('Unsupported blog-type in getPostHTML')
}

function createNewPost({ blogType, title, html }) {
  if (blogType === 'WP') {
    const api = getWPAPIObj()
    return api.posts().create({ title, content: html })
  } else if (blogType === 'GHOST') {
    const { admin: adminApi } = getGhostAPIObj()
    return adminApi.posts.add({ title, html }, { source: 'html' })
  }

  throw new Error('Unsupported blog-type in getPostHTML')
}

function editPost({ blogType, foundPost, html, title }) {
  if (blogType === 'WP') {
    const api = getWPAPIObj()
    return api.posts().id(foundPost.id).update({ content: html })
  } else if (blogType === 'GHOST') {
    const { admin: adminApi } = getGhostAPIObj()
    return adminApi.posts.edit(
      { id: foundPost.id, title, html, updated_at: foundPost.updated_at },
      { source: 'html' }
    )
  }

  throw new Error('Unsupported blog-type in getPostHTML')
}

export async function publish(blogType) {
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

    const posts = await getPosts(blogType)
    const converter = new showdown.Converter()

    for (const [key, value] of Object.entries(files)) {
      const html = converter.makeHtml(value.content)

      const found = findPostWithTitle({ blogType, posts, title: key })

      if (found) {
        await editPost({ blogType, foundPost: found, html, title: key })
      } else {
        await createNewPost({ blogType, title: key, html })
      }
    }
  } catch (e) {
    console.log('itz broken!', e)
    throw e
  }

  return true
}

export async function sync(blogType) {
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

    const noteIds = noteListBar.actionTargetNoteIds

    if (noteIds.length === 0 || Object.keys(notes.hashedItems).length === 0) {
      throw new Error('No note(s) selected.')
    }

    const files = {}

    for (const noteId of noteIds) {
      const note = notes.hashedItems[noteId]
      files[note.title] = { content: note.body }
    }

    const posts = await getPosts(blogType)

    const converter = new showdown.Converter()

    for (const [key, value] of Object.entries(files)) {
      const found = findPostWithTitle({ blogType, posts, title: key })
      if (found) {
        const md = converter.makeMarkdown(getPostHTML({ blogType, post: found }))

        cm.doc.setValue(md)
      }
    }
  } catch (e) {
    console.log('itz broken!', e)
    throw e
  }

  return true
}
