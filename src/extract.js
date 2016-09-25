#!/usr/bin/env node

const cheerio = require('cheerio')
const rp = require('request-promise');
const _ = require('lodash')
const async = require('asyncawait/async')
const awaiting = require('asyncawait/await')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const xml2js = Promise.promisifyAll(require('xml2js'))

const extract = async((path) => {
  const xml = awaiting(fs.readFileAsync(path, 'utf8'))
  const json = awaiting(xml2js.parseStringAsync(xml))
  const feeds = json.opml.body[0].outline
  const result = _.map(feeds, (feed) => {
    return _.map(feed.outline, (f) => {
      return f["$"]
    })
  })
  return _.flatten(result)
})
const htmlfeed = async((feed) => {
  if (!feed || !feed.htmlUrl) {
    return null
  }
  try {
    const options = {
      uri: feed.htmlUrl,
      transform: function (body) {
        return cheerio.load(body).text();
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36'
      }
    };
    feed.samplePage = awaiting(rp(options))
  } catch (e) {
    console.log(`error ${feed.htmlUrl}:\n${JSON.stringify(e, 0, 2)}`)
  }
  return feed
})

const uclassify = async((feed, prefix, uclassifyUrl, readkey) => {
  if (!feed || !feed.htmlUrl) {
    return null
  }
  try {
    const options = {
        method: 'POST',
        uri: uclassifyUrl,
        body: {
            texts: [feed.samplePage]
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36',
          'Authorization': `Token ${readkey}`
        },
        json: true
    };
    feed.topicClassifier = awaiting(rp(options))
    feed.topic = prefix + feed.topicClassifier[0].classification.sort(function(a, b) {
      return b.p - a.p
    })[0].className
  } catch (e) {
    console.log(`error ${feed.htmlUrl}:\n${JSON.stringify(e, 0, 2)}`)
  }
  return feed
})

const classyfeed = async((feed, readkey) => {
  if (!feed || !feed.htmlUrl) {
    return null
  }
  try {
    const options = {
        method: 'POST',
        uri: 'https://api.uclassify.com/v1/uclassify/topics/classify',
        body: {
            texts: [feed.samplePage]
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36',
          'Authorization': `Token ${readkey}`
        },
        json: true
    };
    feed.topicClassifier = awaiting(rp(options))
    feed.topic = feed.topicClassifier[0].classification.sort(function(a, b) {
      return b.p - a.p
    })[0].className
    if (feed.topic === 'Computers') {
      return awaiting(uclassify(
        feed,
        "Computer ",
        "https://api.uclassify.com/v1/uclassify/computer-topics/classify",
        readkey
      ))
    }
  } catch (e) {
    console.log(`error ${feed.htmlUrl}:\n${JSON.stringify(e, 0, 2)}`)
  }
  return feed
})

const handle = async((path, readkey) => {
  const feeds = awaiting(extract(path))
  for (feed of feeds) {
    const feedWithHtml = awaiting(htmlfeed(feed))
    if (feedWithHtml) {
      const classified = awaiting(classyfeed(feedWithHtml, readkey))
      if (classified) {
        console.log(`classyfeed: ${classified.htmlUrl}: ${classified.topic}`)
      }
    }
  }
})

module.exports.extract = extract
module.exports.handle = handle

