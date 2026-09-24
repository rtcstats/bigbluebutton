package org.bigbluebutton.web.services.rtcstats;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import com.google.gson.JsonObject;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Signs JWTs for the rtcstats-server, see https://github.com/rtcstats/rtcstats */
public class RtcStatsService {
  private static final Logger log = LoggerFactory.getLogger(RtcStatsService.class);

  private static final String HMAC_SHA256_ALGORITHM = "HmacSHA256";
  private static final String HEADER = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";

  private String jwtSecret;
  private int tokenTtl = 14400;

  public String generateTokenFor(String sessionId, String conferenceId) {
    if (jwtSecret == null || jwtSecret.isEmpty()) {
      return "";
    }

    long issuedAt = System.currentTimeMillis() / 1000;

    JsonObject rtcStats = new JsonObject();
    rtcStats.addProperty("session", sessionId);
    rtcStats.addProperty("conference", conferenceId);

    JsonObject payload = new JsonObject();
    payload.add("rtcStats", rtcStats);
    payload.addProperty("iat", issuedAt);
    payload.addProperty("exp", issuedAt + tokenTtl);

    String signingInput = encode(HEADER.getBytes(StandardCharsets.UTF_8))
        + "." + encode(payload.toString().getBytes(StandardCharsets.UTF_8));

    String signature = sign(signingInput);
    if (signature == null) {
      return "";
    }

    return signingInput + "." + signature;
  }

  private String sign(String signingInput) {
    try {
      Mac mac = Mac.getInstance(HMAC_SHA256_ALGORITHM);
      mac.init(new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256_ALGORITHM));
      return encode(mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception e) {
      log.error("Failed to sign rtcstats token", e);
      return null;
    }
  }

  private static String encode(byte[] bytes) {
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  public void setJwtSecret(String jwtSecret) {
    this.jwtSecret = jwtSecret;
  }

  public void setTokenTtl(int tokenTtl) {
    this.tokenTtl = tokenTtl;
  }
}
