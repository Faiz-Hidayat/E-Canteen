import requests

def test_post_api_webhooks_midtrans_invalid_signature():
    url = "http://localhost:3000/api/webhooks/midtrans"
    # Construct a Midtrans notification payload with an invalid signature_key
    payload = {
        "transaction_status": "capture",
        "order_id": "order-12345",
        "status_code": "200",
        "gross_amount": "10000.00",
        "signature_key": "invalidsignaturekey",
        "fraud_status": "accept",
        "payment_type": "credit_card"
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Assert HTTP status code 401 Unauthorized
    assert response.status_code == 401, f"Expected status code 401, got {response.status_code}"

    try:
        json_response = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Assert response contains error 'Invalid signature'
    assert "error" in json_response, "Response JSON does not contain 'error' key"
    assert json_response["error"].lower() == "invalid signature", f"Expected error message 'Invalid signature', got '{json_response['error']}'"

test_post_api_webhooks_midtrans_invalid_signature()