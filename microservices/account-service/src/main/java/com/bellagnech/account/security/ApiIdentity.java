package com.bellagnech.account.security;
import org.springframework.web.context.request.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

public record ApiIdentity(String username, String role, Long customerId) {
    public static ApiIdentity current() {
        var attributes = RequestContextHolder.getRequestAttributes();
        if (!(attributes instanceof ServletRequestAttributes request)) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        var identity = (ApiIdentity) request.getRequest().getAttribute("identity");
        if (identity == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return identity;
    }
    public boolean admin() { return "ADMIN".equals(role); }
    public void requireAdmin() { if (!admin()) throw new ResponseStatusException(HttpStatus.FORBIDDEN); }
    public void requireOwner(Long owner) {
        if (!admin() && (customerId == null || !customerId.equals(owner))) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
}
