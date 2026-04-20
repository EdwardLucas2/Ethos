package com.ethos.store;

import com.ethos.exception.DuplicateAccountException;
import com.ethos.exception.DuplicateTagException;
import com.ethos.model.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;
import org.postgresql.util.PSQLException;

public class UserStore {

    private final Jdbi jdbi;

    private static final RowMapper<User> USER_MAPPER = (rs, ctx) -> new User(
            rs.getObject("id", UUID.class),
            rs.getString("supertokens_user_id"),
            rs.getString("display_name"),
            rs.getString("tag"),
            rs.getString("email"),
            rs.getObject("avatar_id", UUID.class),
            rs.getTimestamp("created_at").toInstant());

    public UserStore(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    public User insert(User user) {
        try {
            return jdbi.withHandle(handle -> handle.createQuery(
                            """
                            INSERT INTO users (supertokens_user_id, display_name, tag, email)
                            VALUES (:supertokensUserId, :displayName, :tag, :email)
                            RETURNING id, supertokens_user_id, display_name, tag, email, avatar_id, created_at
                            """)
                    .bind("supertokensUserId", user.supertokensUserId())
                    .bind("displayName", user.displayName())
                    .bind("tag", user.tag())
                    .bind("email", user.email())
                    .map(USER_MAPPER)
                    .one());
        } catch (UnableToExecuteStatementException e) {
            rethrowIfUniqueViolation(e);
            throw e;
        }
    }

    public Optional<User> findById(UUID id) {
        return jdbi.withHandle(handle -> handle.createQuery(
                        """
                        SELECT id, supertokens_user_id, display_name, tag, email, avatar_id, created_at
                        FROM users
                        WHERE id = :id
                        """)
                .bind("id", id)
                .map(USER_MAPPER)
                .findOne());
    }

    public Optional<User> findBySupertokensUserId(String supertokensUserId) {
        return jdbi.withHandle(handle -> handle.createQuery(
                        """
                        SELECT id, supertokens_user_id, display_name, tag, email, avatar_id, created_at
                        FROM users
                        WHERE supertokens_user_id = :supertokensUserId
                        """)
                .bind("supertokensUserId", supertokensUserId)
                .map(USER_MAPPER)
                .findOne());
    }

    public List<User> findByTagPrefix(String prefix, UUID excludeUserId, int limit) {
        return jdbi.withHandle(handle -> handle.createQuery(
                        """
                        SELECT id, supertokens_user_id, display_name, tag, email, avatar_id, created_at
                        FROM users
                        WHERE tag LIKE :prefix
                          AND id != :excludeUserId
                        ORDER BY tag ASC
                        LIMIT :limit
                        """)
                .bind("prefix", prefix + "%")
                .bind("excludeUserId", excludeUserId)
                .bind("limit", limit)
                .map(USER_MAPPER)
                .list());
    }

    private static void rethrowIfUniqueViolation(UnableToExecuteStatementException e) {
        if (e.getCause() instanceof PSQLException psql && "23505".equals(psql.getSQLState())) {
            var msg = psql.getServerErrorMessage();
            if (msg != null && "users_tag_key".equals(msg.getConstraint())) {
                throw new DuplicateTagException();
            }
            throw new DuplicateAccountException();
        }
    }
}
