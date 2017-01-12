# Third-party imports...
import unittest
import mock
import requests

# Local imports...
from siteChecker import pingTest, webServerTest_80, webServerTest_443

class TestPings(unittest.TestCase):

  @mock.patch('siteChecker.subprocess.call')
  def test_ping_local(self, mock_subprocess):

    # Mock the call's return value
    mock_subprocess.return_value = 0

    # Send a request to the API server and store the response.
    response = pingTest('127.0.0.1')

    # Confirm that the request-response cycle completed successfully.
    self.assertEqual(response, 0)

  @mock.patch('siteChecker.subprocess.call')
  def test_ping_bad_host(self, mock_subprocess):

    # Mock the call's return value
    mock_subprocess.return_value = 2

    # Send a request to the API server and store the response.
    response = pingTest('0.0.0.1')

    # Confirm that the request-response cycle completed successfully.
    self.assertEqual(response, 2)

  @mock.patch('siteChecker.subprocess.call')
  def test_ping_timeout(self, mock_subprocess):

    # Mock the call's return value
    mock_subprocess.return_value = 2

    # Send a request to the API server and store the response.
    response = pingTest('hub.docker.com')

    # Confirm that the request-response cycle completed successfully.
    self.assertEqual(response, 2)


class TestwebServerTest_80(unittest.TestCase):

  @mock.patch('siteChecker.requests.get')
  def test_server_good(self, mock_get):
    # Mock the call's return value
    mock_get.return_value.status_code = 200

    # Send a request to the API server and store the response.
    response = webServerTest_80('www.example.com', '/')

    # Confirm that the request-response cycle completed successfully.
    self.assertEqual(response, 200)

  @mock.patch('siteChecker.requests.get')
  def test_server_not_found(self, mock_get):
    # Mock the call's return value
    mock_get.return_value.status_code = 404

    # Send a request to the API server and store the response.
    response = webServerTest_80('www.example.com', '/moo')

    # Confirm that the request-response cycle completed successfully.
    self.assertEqual(response, 404)


class TestwebServerTest_443(unittest.TestCase):

  @mock.patch('siteChecker.requests.get')
  def test_server_good(self, mock_get):
    # Mock the call's return value
    mock_get.return_value.status_code = 200

    # Send a request to the API server and store the response.
    response = webServerTest_443('www.example.com', '/')

    # Confirm that the request-response cycle completed successfully.
    self.assertEqual(response, 200)

  @mock.patch('siteChecker.requests.get')
  def test_server_not_found(self, mock_get):
    # Mock the call's return value
    mock_get.return_value.status_code = 404

    # Send a request to the API server and store the response.
    response = webServerTest_443('www.example.com', '/moo')

    # Confirm that the request-response cycle completed successfully.
    self.assertEqual(response, 404)
