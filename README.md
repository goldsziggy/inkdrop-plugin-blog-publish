# Inkdrop Blog Publish

Blog publish plugin for Inkdrop is meant to allow blogging inside the Inkdrop editor. This plugin exposes 2 options (Sync, Publish), for synching individual blog posts and publishing them out. Because Inkdrop excels as a Markdown editor, I thought to leverage it for some of blogging I have been doing with Ghost Blog. As this plugin is in the early stages, it makes some assumptions and is currently leveraging the `Title` field matching for syncing/editing.

### Supported Blogs

- [x] Ghost Blog
- [ ] Wordpress
- [ ] ????

## Installation

```
ipm install blog-publish
```

## Configuration

Because this plugin is designed to talk to 3rd party blogging software, we have to configure certain config params.

In your `init.js` file for Inkdrop, add the follow lines with your appropriate keys:

```
inkdrop.config.set(
  'ghost-publish.ghostAdminToken','apiTokenValue'
)
inkdrop.config.set('ghost-publish.ghostContentToken', 'fillerValue') // not used and optional
inkdrop.config.set('ghost-publish.ghostUrl', 'www.example.com')
```

### Generating apikey for Ghost Blog

API Keys for Ghost blog are hidden under the integrations tab. From the Ghost Application, navigate to `Settings -> Integrations -> Add custom integration`. After you create your custom integration for Inkdrop, you will be presented with your admin api key.

## Usage

This plugin is designed primarily as a lightweight syncing tool for your blogging on the go.

### Sync feature

As this plugin is in its early stages, this feature makes the assumption that the title of your Note will match the Title of your blog post. When wanting to sync an item that exists on your blog, but not in Inkdrop, perform the following steps:

1. Create a new note
2. Give the new note the same title as the note from the blog
3. Right click the note
4. Click `Sync with Ghost`

![Sync With Ghost Feature Demo](https://raw.githubusercontent.com/goldsziggy/gifs/master/inkdrop/SyncWithGhost.gif)

### Publish feature

As with the Sync feature, when publishing the plugin will look for blog-posts with the same title as your Note. If any matches are found, this plugin will attempt to update the blog-post instead of creating a new one.

![Publish With Ghost Feature Demo](https://raw.githubusercontent.com/goldsziggy/gifs/master/inkdrop/PublishWithGhost.gif)
