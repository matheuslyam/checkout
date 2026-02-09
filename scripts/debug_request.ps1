$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    productId = "ambtus-flash"
    customer = @{
        name = "Matheus de Paula de Lima"
        email = "matheuslyambusiness@gmail.com"
        cpfCnpj = "11622862961"
        phone = "41997806705"
    }
    address = @{
        cep = "83314225"
        endereco = "Rua Tereziano Esteves da Silva"
        numero = "41"
        complemento = ""
        bairro = "Jardim Alterosa"
        cidade = "Piraquara"
        uf = "PR"
    }
    paymentMethod = "PIX"
} | ConvertTo-Json -Depth 4

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/asaas/pay" -Method Post -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "Success:"
    Write-Host ($response | ConvertTo-Json -Depth 4)
} catch {
    Write-Host "Error:"
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}
