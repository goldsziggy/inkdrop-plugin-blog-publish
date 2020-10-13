'use babel'

import { publish, sync } from './publisher'

let commandListener = null

function getFriendlyNameForBlogtype(blogType) {
  if (blogType === 'GHOST') {
    return 'Ghost'
  } else if (blogType === 'WP') {
    return 'Wordpress'
  }

  return ''
}

function notify(level, message, details) {
  const options = {
    dismissable: true,
  }

  if (typeof details === 'string') {
    options.detail = details
  }

  inkdrop.notifications[`add${level}`](message, options)
}

async function doPublish(blogType) {
  try {
    await publish(blogType)
    const friendlyName = getFriendlyNameForBlogtype(blogType)
    notify(
      'Success',
      `Successfully exported to ${friendlyName} Blog`,
      `The selected note has been published to your ${friendlyName} Blog.`
    )
  } catch (err) {
    console.error(err)
    notify('Error', 'Something went wrong while exporting', err.message)
  }
}

async function doSync(blogType) {
  try {
    await sync(blogType)
    const friendlyName = getFriendlyNameForBlogtype(blogType)
    notify(
      'Success',
      `Successfully synched with ${friendlyName} Blog`,
      `The selected note has been updated with the latest from your ${friendlyName} Blog.`
    )
  } catch (err) {
    console.error(err)
    notify('Error', 'Something went wrong while synching', err.message)
  }
}

// async function doSyncFolder()

export const config = {
  ghostAdminToken: {
    title: 'Ghost Admin API Token',
    description: 'The token that is used to authenticate with when publishing to Ghost Blog',
    type: 'string',
    default: '',
  },
  ghostContentToken: {
    title: 'Ghost Content API Token',
    description: 'The token that is used to authenticate with when publishing to Ghost Blog',
    type: 'string',
    default: '',
  },
  ghostUrl: {
    title: 'Ghost URL',
    description: 'The url used to communicate with Ghost',
    type: 'string',
    default: '',
  },
  wordpressUrl: {
    title: 'Wordpress URL',
    description: 'The url used to communicate with Wordpress',
    type: 'string',
    default: '',
  },
  wordpressUsername: {
    title: 'Wordpress Username',
    description: 'The username to be used to publish articles',
    type: 'string',
    default: '',
  },
  wordpressPassword: {
    title: 'Wordpress Password',
    description: 'The password for the matching username',
    type: 'string',
    default: '',
  },
}

export function activate() {
  commandListener = inkdrop.commands.add(document.body, {
    'blog-publish:publish-ghost-single': () => doPublish('GHOST'),
    'blog-publish:sync-ghost-single': () => doSync('GHOST'),
    'blog-publish:publish-wp-single': () => doPublish('WP'),
    'blog-publish:sync-wp-single': () => doSync('WP'),
  })
}

export function deactivate() {
  commandListener.dispose()
}
