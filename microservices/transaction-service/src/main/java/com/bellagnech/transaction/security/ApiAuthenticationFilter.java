package com.bellagnech.transaction.security;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
public class ApiAuthenticationFilter extends OncePerRequestFilter {
    @Value("${jwt.secret:5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437}") private String secret;
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        if (!request.getRequestURI().startsWith("/api/")) { chain.doFilter(request,response); return; }
        String authorization = request.getHeader("Authorization");
        Claims claims;
        try {
            if (authorization == null || !authorization.startsWith("Bearer ")) throw new IllegalArgumentException();
            claims = Jwts.parser().verifyWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret))).build().parseSignedClaims(authorization.substring(7)).getPayload();
            if (claims.getExpiration() == null || claims.getSubject() == null) throw new IllegalArgumentException();
        } catch (Exception invalid) { response.sendError(401, "Authentication required"); return; }
        var identity = new ApiIdentity(claims.getSubject(),claims.get("role",String.class),claims.get("customerId",Long.class));

        request.setAttribute("identity",identity);
        chain.doFilter(request,response);
    }
}
