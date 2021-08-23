/** @module semantic-release-gh-pages-plugin */

import AggregateError from 'aggregate-error'
import fs from 'fs'
import { isEqual } from 'lodash'
import path from 'path'

import { resolveConfig } from './config'
import { publish as ghpagesPublish } from './ghpages'
import { IPushOpts,TContext } from './interface'
import { render } from './tpl'

export * from './defaults'

let _config: any

export const verifyConditions = async (pluginConfig: any, context: TContext) => {
  const { logger } = context
  const config = await resolveConfig(pluginConfig, context, undefined, 'publish')

  logger.log('verify gh-pages config')

  if (!config.token) {
    // eslint-disable-next-line unicorn/error-message
    throw new AggregateError(['env.GH_TOKEN is required by gh-pages plugin'])
  }

  if (!config.repo) {
    // eslint-disable-next-line unicorn/error-message
    throw new AggregateError(['package.json repository.url does not match github.com pattern'])
  }

  if (!fs.existsSync(config.src) || !fs.lstatSync(config.src).isDirectory()) {
    logger.error('Resolved docs src path=', path.resolve(config.src))
    // eslint-disable-next-line unicorn/error-message
    throw new AggregateError(['docs source directory does not exist'])
  }

  Object.assign(pluginConfig, config)

  _config = config
}

export const publish = async (pluginConfig: any, context: TContext) => {
  const config = await resolveConfig(pluginConfig, context, undefined, 'publish')
  const { logger, env, cwd } = context
  const message = render(config.msg, context, logger)
  const pushOpts: IPushOpts = {
    ...config,
    message,
    logger,
    env,
    cwd
  }

  if (!isEqual(_config, config)) {
    await verifyConditions(pluginConfig, context)
  }

  logger.log('Publishing docs via gh-pages')

  return ghpagesPublish(pushOpts)
}

export default {
  verifyConditions,
  publish
}
