#!/usr/bin/env python

import os
import subprocess
import json
import requests
import yaml
import urllib
from slackclient import SlackClient
from tinydb import TinyDB, where, Query

def pingTest(url):
    "Ping a domain. If it returns a 0, the site is good."
    response = subprocess.call(['ping', '-c', '1', url], stdout=subprocess.PIPE)
    return response

def responseTimeTest(baseurl, path):
    "Get server response time for url"
    responseTime = requests.get('http://' + "{0}{1}".format(baseurl, path)).elapsed.total_seconds()
    return responseTime


def webServerTest_80(baseurl, path):
    "Connect to site via HTTP.  If it returns a 200, the site is up."
    response = requests.get('http://' + "{0}{1}".format(baseurl, path))
    return response.status_code


def webServerTest_443(baseurl, path):
    "Connect to site via HTTP.  If it returns a 200, the site is up."
    response = requests.get('http://' + "{0}{1}".format(baseurl, path))
    return response.status_code


def read_site_yaml():
    "Imports content from the YAML file as a dictionary."
    with open("site_list.yml", 'r') as file:
        return (yaml.load(file))


def send_message_to_slack(config, message):
    "Sends a message to Slack"
    params = "{\"text\": " + "\"{}".format(message) + "\"}\""
    post_to_slack = urllib.urlopen(
        "https://hooks.slack.com/services/{}".format(
            config["SLACK_WEBHOOK_TOKEN"]), params)
    post_to_slack.read()


def check_sites(config):
    "Main Function that reads in yaml file and runs all of the checks"
    responseMaxMS = config["responseMaxMS"]   
    site_list = read_site_yaml()
    db = TinyDB('statusdb.json')

    for i in site_list:
        site_info = site_list[i]
        baseurl = site_info['base_url']
        path = site_info['path']
        checkPing = site_info['checkPing']
        checkTime = site_info['checkTime']
        checkHTTP = site_info['checkHTTP']
        checkHTTPS = site_info['checkHTTPS']
        SiteDBQ = Query()
        if db.contains(SiteDBQ.url == "{0}{1}".format(baseurl, path)) == False:
            db.insert({'url': "{0}{1}".format(baseurl, path), 'status': 'up', 'response_time': 0})

        if checkHTTP == "yes":
            if webServerTest_80(baseurl, path) != 200:
                send_message_to_slack(config, i + " is not responding to HTTP requests. \
                Error Code {}".format(webServerTest_80(baseurl, path)))

        if checkHTTPS == "yes":
            if webServerTest_443(baseurl, path) != 200:
                send_message_to_slack(config, i + " is not responding to HTTPS requests. \
                Error Code {}".format(webServerTest_443(baseurl, path)))

        if checkPing == "yes":
            if pingTest(baseurl) != 0:
                send_message_to_slack(config, 
                    i + " is not responding to Ping requests.")
                     
        if checkTime == "yes":

            responseTime = responseTimeTest(baseurl, path) * 1000
            siteURL = "{0}{1}".format(baseurl, path)
            siteStatus = db.get(SiteDBQ['url'] == siteURL)

            if (responseTime > responseMaxMS) and (siteStatus['status'] == 'up'):
                send_message_to_slack(config, 
                    i + " is taking longer then " + str(responseMaxMS) + "ms to connect (took " + str(responseTime) + "ms instead)")
                db.update({'status': 'degraded', 'response_time': responseTime}, SiteDBQ['url'] == siteURL)

            elif (responseTime <= responseMaxMS) and (siteStatus['status'] == 'degraded'):
                send_message_to_slack(config, 
                    i + " is now responding nomally.")
                db.update({'status': 'up', 'response_time': responseTime}, SiteDBQ['url'] == siteURL)
               

if __name__ == "__main__":
    config = json.load(open("config.json"))
    check_sites(config)
