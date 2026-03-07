import requests

def test_post_api_webhooks_midtrans_valid_notification():
    base_url = "http://localhost:3000"
    url = f"{base_url}/api/webhooks/midtrans"
    timeout = 30

    # Sample valid Midtrans notification body with all required fields.
    # Note: signature_key likely invalid since MIDTRANS_SERVER_KEY unknown;
    # but we focus on structure and response format.
    payload = {
        "transaction_status": "capture",
        "order_id": "order-12345",
        "status_code": "200",
        "gross_amount": "15000.00",
        "signature_key": "validsignatureplaceholder1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",  # Dummy value
        "fraud_status": "accept",
        "payment_type": "credit_card"
    }

    try:
        response = requests.post(url, json=payload, timeout=timeout)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # The server should respond with 200 and JSON {status:'ok'} if accepted.
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    try:
        resp_json = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert "status" in resp_json, "Response JSON missing 'status' key"
    assert resp_json["status"] == "ok", f"Expected status 'ok', got {resp_json['status']}"

test_post_api_webhooks_midtrans_valid_notification()