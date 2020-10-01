"use strict";
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.activate = activate;
exports.deactivate = deactivate;
exports.config = void 0;

var _publisher = require("./publisher");

let commandListener = null;

function notify(level, message, details) {
  const options = {
    dismissable: true
  };

  if (typeof details === 'string') {
    options.detail = details;
  }

  inkdrop.notifications[`add${level}`](message, options);
}

async function doPublishGhost(isPublic) {
  try {
    await (0, _publisher.publishToGhost)(isPublic);
    notify('Success', 'Successfully exported to Ghost Blog', `The selected note has been published to your Ghost Blog.`);
  } catch (err) {
    console.error(err);
    notify('Error', 'Something went wrong while exporting', err.message);
  }
}

async function doSyncGhost(isPublic) {
  try {
    await (0, _publisher.syncWithGhost)(isPublic);
    notify('Success', 'Successfully synched with Ghost Blog', `The selected note has been updated with the latest from your Ghost Blog.`);
  } catch (err) {
    console.error(err);
    notify('Error', 'Something went wrong while synching', err.message);
  }
}

const config = {
  ghostAdminToken: {
    title: 'Ghost Admin API Token',
    description: 'The token that is used to authenticate with when publishing to Ghost Blog',
    type: 'string',
    default: ''
  },
  ghostContentToken: {
    title: 'Ghost Content API Token',
    description: 'The token that is used to authenticate with when publishing to Ghost Blog',
    type: 'string',
    default: ''
  },
  ghostUrl: {
    title: 'Ghost URL',
    description: 'The url used to communicate with Ghost',
    type: 'string',
    default: ''
  }
};
exports.config = config;

function activate() {
  commandListener = inkdrop.commands.add(document.body, {
    'blog-publish:publish-ghost-single': () => doPublishGhost(),
    'blog-publish:sync-ghost-single': () => doSyncGhost()
  });
}

function deactivate() {
  commandListener.dispose();
}