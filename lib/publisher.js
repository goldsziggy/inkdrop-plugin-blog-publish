"use strict";
// inspiration
// https://github.com/jmerle/inkdrop-export-as-gist/blob/master/src/exporter.js
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.publish = publish;
exports.syncAllPosts = syncAllPosts;
exports.sync = sync;

var _adminApi = _interopRequireDefault(require("@tryghost/admin-api"));

var _contentApi = _interopRequireDefault(require("@tryghost/content-api"));

var _wpapi = _interopRequireDefault(require("wpapi"));

var _markdownYamlMetadataParser = _interopRequireDefault(require("markdown-yaml-metadata-parser"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const showdown = require('showdown');

function getWPAPIObj() {
  const endpoint = inkdrop.config.get('blog-publish.wordpressUrl');
  const username = inkdrop.config.get('blog-publish.wordpressUsername');
  const password = inkdrop.config.get('blog-publish.wordpressPassword');
  return new _wpapi.default({
    endpoint,
    username,
    password
  });
}

function getGhostAPIObj() {
  const contentToken = inkdrop.config.get('blog-publish.ghostContentToken');
  const adminToken = inkdrop.config.get('blog-publish.ghostAdminToken');
  const url = inkdrop.config.get('blog-publish.ghostUrl'); // leaving the content API in here in case there is a need in the future

  return {
    admin: new _adminApi.default({
      url,
      key: adminToken,
      version: 'v3'
    }),
    client: new _contentApi.default({
      url,
      key: contentToken,
      version: 'v3'
    })
  };
}

function getPosts(blogType) {
  if (blogType === 'WP') {
    const api = getWPAPIObj();
    return api.posts();
  } else if (blogType === 'GHOST') {
    const {
      admin: adminApi
    } = getGhostAPIObj();
    return adminApi.posts.browse({
      limit: 'all',
      formats: ['html']
    });
  }

  throw new Error('Unsupported blog-type in getPosts');
}

function findPost({
  blogType,
  posts,
  metadata,
  title
}) {
  if (metadata && Object.keys(metadata).length > 0) {
    console.log('Finding by metadata');
    return findPostWithMetadata({
      blogType,
      metadata,
      posts
    });
  } else if (title) {
    console.log('Finding by title');
    return findPostWithTitle({
      blogType,
      posts,
      title
    });
  }

  throw new Error('Unsupported find post');
}

function findPostWithMetadata({
  blogType,
  metadata,
  posts
}) {
  if (blogType === 'WP') {
    return posts.find(post => post.id === metadata.blogId);
  } else if (blogType === 'GHOST') {
    return posts.find(post => post.id === metadata.blogId);
  }

  throw new Error('Unsupported blog-type in findPostWithTitle');
}

function findPostWithTitle({
  blogType,
  posts,
  title
}) {
  if (blogType === 'WP') {
    return posts.find(post => post.title.rendered === title);
  } else if (blogType === 'GHOST') {
    return posts.find(post => post.title === title);
  }

  throw new Error('Unsupported blog-type in findPostWithTitle');
}

function getPostHTML({
  blogType,
  post
}) {
  if (blogType === 'WP') {
    return post.content.rendered;
  } else if (blogType === 'GHOST') {
    console.log({
      post
    });
    return post.html;
  }

  throw new Error('Unsupported blog-type in getPostHTML');
} // @TODO: maybe get some getTitle functions?  Maybe make a Post object to do this?


function getMetadataTag({
  post,
  blogType
}) {
  if (blogType === 'WP' || blogType === 'GHOST') {
    return `---
title: ${blogType === 'WP' ? post.title.rendered : post.title}
blogType: ${blogType === 'WP' ? 'Wordpress' : 'Ghost'}
blogId: ${post.id}
link: ${blogType === 'WP' ? post.link : post.url}
---
  `;
  }

  throw new Error('Unsupported blog-type in getMetadataTag');
}

function createNewPost({
  blogType,
  title,
  html
}) {
  if (blogType === 'WP') {
    const api = getWPAPIObj();
    return api.posts().create({
      title,
      content: html
    });
  } else if (blogType === 'GHOST') {
    const {
      admin: adminApi
    } = getGhostAPIObj();
    return adminApi.posts.add({
      title,
      html
    }, {
      source: 'html'
    });
  }

  throw new Error('Unsupported blog-type in getPostHTML');
}

function editPost({
  blogType,
  foundPost,
  html,
  title
}) {
  if (blogType === 'WP') {
    const api = getWPAPIObj();
    return api.posts().id(foundPost.id).update({
      content: html
    });
  } else if (blogType === 'GHOST') {
    const {
      admin: adminApi
    } = getGhostAPIObj();
    return adminApi.posts.edit({
      id: foundPost.id,
      title,
      html,
      updated_at: foundPost.updated_at
    }, {
      source: 'html'
    });
  }

  throw new Error('Unsupported blog-type in getPostHTML');
}

async function publish(blogType) {
  const {
    noteListBar,
    notes
  } = inkdrop.store.getState();
  const noteIds = noteListBar.actionTargetNoteIds;

  if (noteIds.length === 0 || Object.keys(notes.hashedItems).length === 0) {
    throw new Error('No note(s) selected.');
  }

  const files = {};

  for (const noteId of noteIds) {
    const note = notes.hashedItems[noteId];
    files[note.title] = {
      content: note.body
    };
  }

  try {
    const {
      noteListBar,
      notes
    } = inkdrop.store.getState();
    const noteIds = noteListBar.actionTargetNoteIds;

    if (noteIds.length === 0 || Object.keys(notes.hashedItems).length === 0) {
      throw new Error('No note(s) selected.');
    }

    const files = {};

    for (const noteId of noteIds) {
      const note = notes.hashedItems[noteId];
      files[note.title] = {
        content: note.body
      };
    }

    const posts = await getPosts(blogType);
    const converter = new showdown.Converter();

    for (const [key, value] of Object.entries(files)) {
      const {
        metadata,
        content
      } = (0, _markdownYamlMetadataParser.default)(value.content);
      const found = findPost({
        blogType,
        posts,
        title: key,
        metadata
      });
      const html = converter.makeHtml(content);
      const {
        cm
      } = inkdrop.getActiveEditor();

      if (found) {
        await editPost({
          blogType,
          foundPost: found,
          html,
          title: key
        }); // if no metadata edit the post and put it in there!

        if (metadata && Object.keys(metadata).length === 0) {
          cm.doc.setValue(getMetadataTag({
            post: found,
            blogType
          }) + value.content);
        }
      } else {
        const post = await createNewPost({
          blogType,
          title: key,
          html
        });
        cm.doc.setValue(getMetadataTag({
          post,
          blogType
        }) + value.content);
      }
    }
  } catch (e) {
    console.log('itz broken!', e);
    throw e;
  }

  return true;
}

async function syncAllPosts(blogType) {
  const db = inkdrop.main.dataStore.getLocalDB();
  const {
    bookList,
    notes
  } = inkdrop.store.getState();
  const book = bookList.bookForContextMenu;
  const posts = await getPosts(blogType);
  const noteIds = notes.items.map(note => (0, _markdownYamlMetadataParser.default)(note.body).metadata.blogId || undefined).filter(v => v !== undefined);
  const files = {};
  noteIds.forEach(id => {
    files[id] = notes.items.find(note => (0, _markdownYamlMetadataParser.default)(note.body).metadata.blogId === id);
  });
  const existingPosts = posts.filter(post => noteIds.includes(post.id));
  const newPosts = posts.filter(post => !noteIds.includes(post.id));
  const converter = new showdown.Converter(); // update existing posts

  const editPostPromises = existingPosts.map(post => {
    const md = converter.makeMarkdown(getPostHTML({
      blogType,
      post
    }));
    const note = { ...files[post.id],
      doctype: 'markdown',
      body: getMetadataTag({
        post,
        blogType
      }) + md,
      title: blogType === 'WP' ? post.title.rendered : post.title,
      updatedAt: +new Date()
    };
    return db.notes.put(note);
  }); // create new posts

  const newPostPromises = newPosts.map(post => {
    const md = converter.makeMarkdown(getPostHTML({
      blogType,
      post
    }));
    const note = {
      bookId: book._id,
      doctype: 'markdown',
      body: getMetadataTag({
        post,
        blogType
      }) + md,
      _id: db.notes.createId(),
      _rev: undefined,
      title: blogType === 'WP' ? post.title.rendered : post.title,
      createdAt: +new Date(),
      updatedAt: +new Date()
    };
    return db.notes.put(note);
  });
  await Promise.all([...newPostPromises, ...editPostPromises]);
}

async function sync(blogType) {
  const {
    noteListBar,
    notes
  } = inkdrop.store.getState();
  const noteIds = noteListBar.actionTargetNoteIds;

  if (noteIds.length === 0 || Object.keys(notes.hashedItems).length === 0) {
    throw new Error('No note(s) selected.');
  }

  const files = {};

  for (const noteId of noteIds) {
    const note = notes.hashedItems[noteId];
    files[note.title] = {
      content: note.body
    };
  }

  try {
    const {
      noteListBar,
      notes
    } = inkdrop.store.getState();
    const {
      cm
    } = inkdrop.getActiveEditor();
    const noteIds = noteListBar.actionTargetNoteIds;

    if (noteIds.length === 0 || Object.keys(notes.hashedItems).length === 0) {
      throw new Error('No note(s) selected.');
    }

    const files = {};

    for (const noteId of noteIds) {
      const note = notes.hashedItems[noteId];
      files[note.title] = {
        content: note.body
      };
    }

    const posts = await getPosts(blogType);
    const converter = new showdown.Converter();

    for (const [key, value] of Object.entries(files)) {
      const {
        metadata
      } = (0, _markdownYamlMetadataParser.default)(value.content);
      const found = findPost({
        blogType,
        posts,
        title: key,
        metadata
      });

      if (found) {
        const md = converter.makeMarkdown(getPostHTML({
          blogType,
          post: found
        }));
        cm.doc.setValue(getMetadataTag({
          post: found,
          blogType
        }) + md);
      }
    }
  } catch (e) {
    console.log('itz broken!', e);
    throw e;
  }

  return true;
}
//# sourceMappingURL=publisher.js.map