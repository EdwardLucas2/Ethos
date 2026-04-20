package com.ethos.exception;

public class NotFoundException extends RuntimeException {
    public NotFoundException() {
        super("Not found");
    }
}
