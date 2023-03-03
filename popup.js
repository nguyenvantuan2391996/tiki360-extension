document.getElementById('button-token').addEventListener('click', async function () {
    copyText("input-token").then(r => {
        console.log(r)
    })
})

document.getElementById('button-customer-id').addEventListener('click', function () {
    copyText("input-customer-id").then(r => {
        console.log(r)
    })
})

document.getElementById('button-order-code').addEventListener('click', function () {
    copyText("input-order-code").then(r => {
        console.log(r)
    })
})

document.getElementById('button-policy-id').addEventListener('click', function () {
    copyText("input-policy-id").then(r => {
        console.log(r)
    })
})

document.getElementById('button-booking-code').addEventListener('click', function () {
    copyText("input-booking-code").then(r => {
        console.log(r)
    })
})

window.addEventListener("load", async (event) => {
    console.log(event)

    // check URL
    const currentURL = await getCurrentTabUrl()
    if (!currentURL.includes("https://beta.tala.xyz/")) {
        alert(INVALID_WEBSITE_MSG)
        return
    }

    // handle
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        chrome.tabs.sendMessage(
            tabs[0].id,
            {
                from: POPUP_SCREEN,
                subject: HANDLE_LOAD_EXTENSION,
                currentURL: currentURL,
            },
            async function (response) {
                if (response === "" || response == null) {
                    alert(DATA_EMPTY_MSG)
                } else {
                    // set value for the input
                    document.getElementById("input-token").setAttribute("value", response.access_token)
                    document.getElementById("input-customer-id").setAttribute("value", response.customer_id)

                    if (currentURL.includes("https://beta.tala.xyz/bao-hiem-so/thong-tin-hop-dong")) {
                        const bookingCode = currentURL.split("/")[5].split("?")[0]
                        const orderCode = await getOrderCode(bookingCode, response)
                        document.getElementById("input-order-code").setAttribute("value", orderCode)
                        document.getElementById("input-booking-code").setAttribute("value", bookingCode)
                        document.getElementById("input-policy-id").setAttribute("value", response.policy_id)
                    }
                }
            })
    })
})

function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

async function copyText(id) {
    const copyText = document.getElementById(id)
    copyText.select()
    copyText.setSelectionRange(0, 99999)

    await navigator.clipboard.writeText(copyText.value).then(r => {
        console.log(r)
        alert("Copied !")
    })
}

async function getCurrentTabUrl () {
    const tabs = await chrome.tabs.query({ active: true })
    return tabs[0].url
}

async function getOrderCode(bookingCode, accessTokenObject) {
    // get transaction id
    const myHeaders = new Headers();
    myHeaders.append("authority", "api.tala.xyz");
    myHeaders.append("accept", "application/json, text/plain, */*");
    myHeaders.append("accept-language", "en-US,en;q=0.9,vi;q=0.8,es;q=0.7");
    myHeaders.append("origin", "https://beta.tala.xyz");
    myHeaders.append("referer", "https://beta.tala.xyz/bao-hiem-so/lich-su-giao-dich/" + bookingCode)
    myHeaders.append("sec-fetch-dest", "empty");
    myHeaders.append("sec-fetch-mode", "cors");
    myHeaders.append("sec-fetch-site", "same-site");
    myHeaders.append("user-agent", ARRAY_USER_AGENT[Math.floor(Math.random()*ARRAY_USER_AGENT.length)]);
    myHeaders.append("x-access-token", accessTokenObject.access_token);

    const requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow',
    };

    let transactionID = ""
    await fetch("https://api.tala.xyz/ds-insurance/v2/policies/transaction/list?code=" + bookingCode, requestOptions)
        .then(response => response.json())
        .then(result => {
            transactionID = result.data.list[0].history[0].transaction_id
        })
        .catch(error => {
            alert(error)
        });

    // get transaction detail
    const myHeadersTransactionDetail = new Headers();
    myHeadersTransactionDetail.append("authority", "api.tala.xyz");
    myHeadersTransactionDetail.append("accept", "application/json, text/plain, */*");
    myHeadersTransactionDetail.append("accept-language", "en-US,en;q=0.9,vi;q=0.8,es;q=0.7");
    myHeadersTransactionDetail.append("origin", "https://beta.tala.xyz");
    myHeadersTransactionDetail.append("referer", "https://beta.tala.xyz/bao-hiem-so/thong-tin-giao-dich/" + transactionID + transactionID + "/transaction")
    myHeadersTransactionDetail.append("sec-fetch-dest", "empty");
    myHeadersTransactionDetail.append("sec-fetch-mode", "cors");
    myHeadersTransactionDetail.append("sec-fetch-site", "same-site");
    myHeadersTransactionDetail.append("user-agent", ARRAY_USER_AGENT[Math.floor(Math.random()*ARRAY_USER_AGENT.length)]);
    myHeadersTransactionDetail.append("x-access-token", accessTokenObject.access_token);

    const requestOptionsTransactionDetail = {
        method: 'GET',
        headers: myHeadersTransactionDetail,
        redirect: 'follow'
    };

    let orderCode = ""
    await fetch("https://api.tala.xyz/ds-insurance/v2/policies/transaction/detail?transaction_id=" + transactionID + "&type=transaction", requestOptionsTransactionDetail)
        .then(response => response.json())
        .then(result => {
            for (const element of result.data.details) {
                if (element.name === "Mã đơn hàng Tiki") {
                    orderCode = element.value
                }
            }

        })
        .catch(error => {
            alert(error)
        });

    // debugger
    return orderCode
}